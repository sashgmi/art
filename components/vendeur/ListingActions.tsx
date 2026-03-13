"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Pencil, Archive, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const EDITABLE = ["DRAFT", "REVISION", "PENDING_REVIEW", "LIVE"];
const ARCHIVABLE = ["DRAFT", "REVISION", "PENDING_REVIEW", "LIVE"];

interface Props {
  listingId: string;
  status: string;
}

export default function ListingActions({ listingId, status }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const canEdit = EDITABLE.includes(status);
  const canArchive = ARCHIVABLE.includes(status);

  if (!canEdit && !canArchive) return null;

  const handleArchive = async () => {
    if (!confirm("Retirer cette annonce ? Elle sera archivée et ne sera plus visible.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/listings/${listingId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Annonce retirée" });
      router.refresh();
    } catch (err: unknown) {
      toast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {canEdit && (
        <Link href={`/vendeur/annonces/${listingId}/modifier`}>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
            <Pencil className="h-3 w-3" />
            Modifier
          </Button>
        </Link>
      )}
      {canArchive && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleArchive}
          disabled={loading}
          className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Archive className="h-3 w-3" />
          )}
          Retirer
        </Button>
      )}
    </div>
  );
}
