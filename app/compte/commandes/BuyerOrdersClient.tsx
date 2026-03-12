"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import {
  Loader2,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  MapPin,
} from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  platformFee: number;
  shippingCost: number;
  vendorAmount: number;
  currency: string;
  createdAt: string;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  fundsReleasedAt?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  shippingAddress?: any;
  listing: {
    id: string;
    title: string;
    titleAdmin?: string | null;
    slug: string;
    images: { url: string }[];
  };
}

const STATUS_META: Record<string, { label: string; variant: any }> = {
  PENDING_PAYMENT: { label: "Paiement en attente", variant: "default" },
  PAYMENT_HELD: { label: "En préparation", variant: "warning" },
  SHIPPED: { label: "En cours de livraison", variant: "warning" },
  DELIVERED: { label: "Livré", variant: "success" },
  CONFIRMED: { label: "Réception confirmée", variant: "success" },
  FUNDS_RELEASED: { label: "Terminé", variant: "success" },
  DISPUTED: { label: "Litige en cours", variant: "destructive" },
  REFUNDED: { label: "Remboursé", variant: "destructive" },
  CANCELLED: { label: "Annulé", variant: "default" },
};

const FILTER_TABS = [
  { value: "ALL", label: "Toutes" },
  { value: "ACTIVE", label: "En cours" },
  { value: "SHIPPED", label: "Expédiées" },
  { value: "TO_CONFIRM", label: "À confirmer" },
  { value: "DONE", label: "Terminées" },
];

function matchFilter(status: string, filter: string): boolean {
  switch (filter) {
    case "ACTIVE": return ["PENDING_PAYMENT", "PAYMENT_HELD"].includes(status);
    case "SHIPPED": return status === "SHIPPED";
    case "TO_CONFIRM": return ["PAYMENT_HELD", "SHIPPED", "DELIVERED"].includes(status);
    case "DONE": return ["CONFIRMED", "FUNDS_RELEASED"].includes(status);
    default: return true;
  }
}

export default function BuyerOrdersClient({ orders: initial }: { orders: Order[] }) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("ALL");

  const canConfirm = (status: string) =>
    ["PAYMENT_HELD", "SHIPPED", "DELIVERED"].includes(status);

  const handleConfirm = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/confirm`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "CONFIRMED", confirmedAt: new Date().toISOString() }
            : o
        )
      );
      toast({ title: "Réception confirmée", description: "Merci ! Les fonds vont être libérés au vendeur." });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  const filtered = orders.filter((o) => matchFilter(o.status, filter));

  const toConfirmCount = orders.filter((o) => canConfirm(o.status)).length;

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
            {tab.value === "TO_CONFIRM" && toConfirmCount > 0 && (
              <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gold-500 text-white text-xs">
                {toConfirmCount}
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
            <p>Aucune commande dans cette catégorie</p>
          </div>
        )}

        {filtered.map((order) => {
          const isExpanded = expandedId === order.id;
          const isLoading = loadingId === order.id;
          const meta = STATUS_META[order.status] || { label: order.status, variant: "default" };
          const title = order.listing.titleAdmin || order.listing.title;

          return (
            <div key={order.id} className="rounded-sm border border-border bg-white overflow-hidden">
              {/* Row */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-stone-50"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="relative h-12 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                  {order.listing.images[0] ? (
                    <Image
                      src={order.listing.images[0].url}
                      alt={title}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                </div>

                <div className="flex items-center gap-3">
                  <p className="font-semibold text-sm shrink-0">{formatPrice(order.total)}</p>
                  <Badge variant={meta.variant} className="text-xs shrink-0">{meta.label}</Badge>
                  {canConfirm(order.status) && (
                    <Button
                      size="sm"
                      variant="gold"
                      className="shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleConfirm(order.id); }}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                      Confirmer
                    </Button>
                  )}
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
                  <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                    {[
                      { label: "Sous-total", value: formatPrice(order.subtotal) },
                      { label: "Frais de livraison", value: formatPrice(order.shippingCost) },
                      { label: "Commission", value: formatPrice(order.platformFee) },
                      { label: "Total payé", value: formatPrice(order.total) },
                      { label: "Référence", value: order.id.slice(0, 12) + "…" },
                      { label: "Commandé le", value: formatDate(order.createdAt) },
                      { label: "Confirmé le", value: order.confirmedAt ? formatDate(order.confirmedAt) : "—" },
                      { label: "Statut", value: meta.label },
                    ].map((item) => (
                      <div key={item.label}>
                        <dt className="text-xs text-muted-foreground">{item.label}</dt>
                        <dd className="font-medium mt-0.5">{item.value}</dd>
                      </div>
                    ))}
                  </div>

                  {/* Tracking */}
                  {order.trackingNumber && (
                    <div className="rounded-sm border border-border bg-stone-50 p-4 flex items-start gap-3 text-sm">
                      <Truck className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Suivi de livraison</p>
                        {order.trackingCarrier && (
                          <p className="text-muted-foreground text-xs">{order.trackingCarrier}</p>
                        )}
                        <p className="font-mono mt-1">{order.trackingNumber}</p>
                        {order.shippedAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Expédié le {formatDate(order.shippedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Shipping address */}
                  {order.shippingAddress && (
                    <div className="rounded-sm border border-border bg-stone-50 p-4 flex items-start gap-3 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Adresse de livraison</p>
                        <p className="text-muted-foreground">
                          {order.shippingAddress.name}<br />
                          {order.shippingAddress.line1}<br />
                          {order.shippingAddress.line2 && <>{order.shippingAddress.line2}<br /></>}
                          {order.shippingAddress.postalCode} {order.shippingAddress.city}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Confirm CTA */}
                  {canConfirm(order.status) && (
                    <div className="flex justify-end pt-2">
                      <Button
                        variant="gold"
                        onClick={() => handleConfirm(order.id)}
                        disabled={isLoading}
                        className="gap-2"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        Confirmer la bonne réception
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
