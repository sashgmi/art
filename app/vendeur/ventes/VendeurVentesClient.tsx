"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Loader2,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CheckCircle,
  Clock,
} from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;
  vendorAmount: number;
  shippingCost: number;
  currency: string;
  createdAt: string;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  fundsReleasedAt?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  listing: {
    id: string;
    title: string;
    titleAdmin?: string | null;
    slug: string;
    images: { url: string }[];
  };
  buyer: { id: string; name: string | null; email: string | null };
}

const STATUS_META: Record<string, { label: string; variant: any }> = {
  PENDING_PAYMENT: { label: "Paiement en attente", variant: "default" },
  PAYMENT_HELD: { label: "À expédier", variant: "warning" },
  SHIPPED: { label: "Expédiée", variant: "default" },
  DELIVERED: { label: "Livrée", variant: "default" },
  CONFIRMED: { label: "Confirmée", variant: "success" },
  FUNDS_RELEASED: { label: "Versée", variant: "success" },
  DISPUTED: { label: "Litige", variant: "destructive" },
  REFUNDED: { label: "Remboursée", variant: "destructive" },
  CANCELLED: { label: "Annulée", variant: "default" },
};

const FILTER_TABS = [
  { value: "ALL", label: "Toutes" },
  { value: "TO_SHIP", label: "À expédier" },
  { value: "SHIPPED", label: "Expédiées" },
  { value: "CONFIRMED", label: "Confirmées" },
  { value: "FUNDS_RELEASED", label: "Versées" },
];

function matchFilter(status: string, filter: string): boolean {
  switch (filter) {
    case "TO_SHIP": return status === "PAYMENT_HELD";
    case "SHIPPED": return status === "SHIPPED";
    case "CONFIRMED": return status === "CONFIRMED";
    case "FUNDS_RELEASED": return status === "FUNDS_RELEASED";
    default: return true;
  }
}

function daysAgo(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function VendeurVentesClient({ orders: initial }: { orders: Order[] }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");
  const [trackingInputs, setTrackingInputs] = useState<Record<string, { number: string; carrier: string }>>({});

  const toShipCount = orders.filter((o) => o.status === "PAYMENT_HELD").length;

  const handleShip = async (orderId: string) => {
    const input = trackingInputs[orderId];
    if (!input?.number?.trim()) {
      toast({ title: "Numéro de suivi requis", variant: "destructive" });
      return;
    }
    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/ship`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingNumber: input.number.trim(), trackingCarrier: input.carrier || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "SHIPPED", trackingNumber: input.number.trim(), trackingCarrier: input.carrier || null, shippedAt: new Date().toISOString() }
            : o
        )
      );
      toast({ title: "Commande marquée comme expédiée", description: "L'acheteur a été notifié par email." });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = orders.filter((o) => matchFilter(o.status, filter));

  return (
    <div>
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === tab.value
                ? "bg-foreground text-background"
                : "border border-border hover:bg-muted"
            }`}
          >
            {tab.label}
            {tab.value === "TO_SHIP" && toShipCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-xs">
                {toShipCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Aucune vente dans cette catégorie</p>
          </div>
        )}

        {filtered.map((order) => {
          const isExpanded = expandedId === order.id;
          const isLoading = loadingId === order.id;
          const meta = STATUS_META[order.status] || { label: order.status, variant: "default" };
          const title = order.listing.titleAdmin || order.listing.title;
          const daysShipped = order.shippedAt ? daysAgo(order.shippedAt) : null;
          const autoEligibleIn = daysShipped !== null ? Math.max(0, 10 - daysShipped) : null;
          const input = trackingInputs[order.id] || { number: "", carrier: "" };

          return (
            <div key={order.id} className="rounded-sm border border-border bg-white overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-stone-50"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="relative h-12 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                  {order.listing.images[0] ? (
                    <Image src={order.listing.images[0].url} alt={title} fill className="object-cover" sizes="56px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{title}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.buyer?.name || order.buyer?.email} · {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{formatPrice(order.vendorAmount)}</p>
                    <p className="text-xs text-muted-foreground">votre part</p>
                  </div>
                  <Badge variant={meta.variant} className="text-xs shrink-0">{meta.label}</Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>

              {/* Expanded */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-3">
                    {[
                      { label: "Total acheteur", value: formatPrice(order.total) },
                      { label: "Votre part", value: formatPrice(order.vendorAmount) },
                      { label: "Référence", value: order.id.slice(0, 12) + "…" },
                      { label: "Commandé le", value: formatDate(order.createdAt) },
                      { label: "Expédié le", value: order.shippedAt ? formatDate(order.shippedAt) : "—" },
                      { label: "Confirmé le", value: order.confirmedAt ? formatDate(order.confirmedAt) : "—" },
                    ].map((item) => (
                      <div key={item.label}>
                        <dt className="text-xs text-muted-foreground">{item.label}</dt>
                        <dd className="font-medium mt-0.5">{item.value}</dd>
                      </div>
                    ))}
                  </div>

                  {/* Tracking existant */}
                  {order.trackingNumber && (
                    <div className="rounded-sm border border-border bg-stone-50 p-4 flex items-start gap-3 text-sm">
                      <Truck className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Suivi renseigné</p>
                        {order.trackingCarrier && <p className="text-xs text-muted-foreground">{order.trackingCarrier}</p>}
                        <p className="font-mono mt-1">{order.trackingNumber}</p>
                        {autoEligibleIn !== null && order.status === "SHIPPED" && (
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {autoEligibleIn > 0
                              ? `Auto-confirmation dans ${autoEligibleIn} jour${autoEligibleIn > 1 ? "s" : ""} si aucun litige`
                              : "Éligible à la libération (10 jours écoulés)"}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Formulaire tracking si pas encore expédié */}
                  {order.status === "PAYMENT_HELD" && (
                    <div className="rounded-sm border border-amber-200 bg-amber-50 p-4 space-y-3">
                      <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        Renseignez le numéro de suivi pour marquer comme expédié
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-amber-800 mb-1 block">
                            Numéro de suivi <span className="text-destructive">*</span>
                          </label>
                          <input
                            type="text"
                            value={input.number}
                            onChange={(e) =>
                              setTrackingInputs((prev) => ({
                                ...prev,
                                [order.id]: { ...input, number: e.target.value },
                              }))
                            }
                            placeholder="1Z999AA10123456784"
                            className="w-full rounded-sm border border-amber-300 bg-white px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-gold-400"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-amber-800 mb-1 block">
                            Transporteur
                          </label>
                          <select
                            value={input.carrier}
                            onChange={(e) =>
                              setTrackingInputs((prev) => ({
                                ...prev,
                                [order.id]: { ...input, carrier: e.target.value },
                              }))
                            }
                            className="w-full rounded-sm border border-amber-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gold-400"
                          >
                            <option value="">Sélectionner…</option>
                            <option value="Colissimo">Colissimo</option>
                            <option value="Chronopost">Chronopost</option>
                            <option value="DHL">DHL</option>
                            <option value="FedEx">FedEx</option>
                            <option value="Mondial Relay">Mondial Relay</option>
                            <option value="UPS">UPS</option>
                            <option value="Autre">Autre</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleShip(order.id)}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Marquer comme expédié
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
