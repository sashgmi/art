import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Check admin routes
  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(
        new URL("/connexion?callbackUrl=" + encodeURIComponent(pathname), req.url)
      );
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Check vendor routes
  if (pathname.startsWith("/vendeur")) {
    if (!session) {
      return NextResponse.redirect(
        new URL("/connexion?callbackUrl=" + encodeURIComponent(pathname), req.url)
      );
    }
    if (session.user.role !== "VENDOR" && session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Check protected routes
  if (pathname.startsWith("/compte") || pathname.startsWith("/favoris")) {
    if (!session) {
      return NextResponse.redirect(
        new URL("/connexion?callbackUrl=" + encodeURIComponent(pathname), req.url)
      );
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
