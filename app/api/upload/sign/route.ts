import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateUploadSignature } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // Only vendors and admins can upload images
  if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { listingId } = body;

    const signedParams = generateUploadSignature({ listingId });

    return NextResponse.json(signedParams);
  } catch (error) {
    console.error("Upload sign error:", error);
    return NextResponse.json(
      { error: "Erreur de génération de signature" },
      { status: 500 }
    );
  }
}
