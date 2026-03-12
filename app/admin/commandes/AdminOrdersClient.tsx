"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { formatPrice, formatDate } from "@/lib/utils";
import { Loader2, Unlock, ChevronDown, ChevronUp, Zap, Clock } from "lucide-react";

interface Order {
  id: string;
  status: string;
  total: any;
  subtotal: any;
  platformFee: any;
  vendorAmount: any;
  shippingCost: any;
  currency: string;
  stripePaymentIntentId?: string | null;
  createdAt: string;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  fundsReleasedAt?: string | null;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  daysShipped?: number | null;
  isAutoEligible?: boolean;
  vendorIban?: string | null;
  vendorBic?: string | null;
  vendorBankName?: string | null;
  vendorStripeConnected?: boolean;
  listing: {
    id: string;
    title: string;
    titleAdmin?: string | null;
    slug: string;
    images: { url: string }[];
  };
  buyer: { id: string; name: string | null; email: string | null };
}

interface Props {
  orders: Order[];
}

const STATUS_META: Record<string, { label: string; variant: any }> = {
  PENDING_PAYMENT: { label: "Paiement en attente", variant: "default" },
  PAYMENT_HELD: { label: "Fonds en séquestre", variant: "warning" },
  SHIPPED: { label: "Expédié", variant: "default" },
  DELIVERED: { label: "Livré", variant: "default" },
  CONFIRMED: { label: "Confirmé par l'acheteur", variant: "success" },
  FUNDS_RELEASED: { label: "Fonds libérés", variant: "success" },
  DISPUTED: { label: "Litige", variant: "destructive" },
  REFUNDED: { label: "Remboursé", variant: "destructive" },
  CANCELLED: { label: "Annulé", variant: "default" },
};

export default function AdminOrdersClient({ orders: initial }: Props) {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");

  const canRelease = (order: Order) =>
    ["PAYMENT_HELD", "CONFIRMED", "DELIVERED"].includes(order.status) ||
    (order.status === "SHIPPED" && !!order.isAutoEligible);

  const handleRelease = async (orderId: string) => {
    setLoadingId(orderId);
    try {
      const res = await fetch("/api/stripe/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: "FUNDS_RELEASED", fundsReleasedAt: new Date().toISOString() }
            : o
        )
      );

      toast({
        title: "Fonds libérés !",
        description:
          data.method === "STRIPE_TRANSFER"
            ? `Virement Stripe de ${formatPrice(data.amount)} effectué automatiquement.`
            : data.iban
            ? `Effectuez le virement SEPA de ${formatPrice(data.amount)} vers ${data.iban}`
            : `Montant à virer manuellement : ${formatPrice(data.amount)}`,
      });
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setLoadingId(null);
    }
  };

  const filteredOrders =
    filterStatus === "ALL"
      ? orders
      : orders.filter((o) => o.status === filterStatus);

  const pendingRelease = orders.filter((o) =>
    ["PAYMENT_HELD", "CONFIRMED"].includes(o.status)
  ).length;

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { value: "ALL", label: "Toutes" },
          { value: "CONFIRMED", label: `À libérer (${pendingRelease})` },
          { value: "PAYMENT_HELD", label: "En séquestre" },
          { value: "FUNDS_RELEASED", label: "Libérées" },
          { value: "CANCELLED", label: "Annulées" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`rounded-sm px-3 py-1.5 text-sm font-medium transition-colors ${
              filterStatus === tab.value
                ? "bg-foreground text-background"
                : "border border-border hover:bg-muted"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="space-y-2">
        {filteredOrders.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            Aucune commande
          </div>
        )}

        {filteredOrders.map((order) => {
          const isExpanded = expandedId === order.id;
          const isLoading = loadingId === order.id;
          const meta = STATUS_META[order.status] || { label: order.status, variant: "default" };
          const listingTitle = order.listing.titleAdmin || order.listing.title;

          return (
            <div key={order.id} className="rounded-sm border border-border bg-white overflow-hidden">
              {/* Header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-stone-50"
                onClick={() => setExpandedId(isExpanded ? null : order.id)}
              >
                <div className="relative h-12 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-muted">
                  {order.listing.images[0] && (
                    <Image
                      src={order.listing.images[0].url}
                      alt={listingTitle}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{listingTitle}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.buyer?.name || order.buyer?.email} · {formatDate(order.createdAt)}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm">{formatPrice(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground">
                      Vendeur: {formatPrice(Number(order.vendorAmount))}
                    </p>
                  </div>

                  <Badge variant={meta.variant} className="text-xs shrink-0">
                    {meta.label}
                  </Badge>

                  {order.isAutoEligible && (
                    <Badge variant="warning" className="text-xs shrink-0 gap-1">
                      <Clock className="h-3 w-3" />
                      Auto-éligible
                    </Badge>
                  )}

                  {canRelease(order) && (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleRelease(order.id); }}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlock className="h-3.5 w-3.5" />}
                      Libérer
                    </Button>
                  )}

                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm lg:grid-cols-4">
                    {[
                      { label: "Sous-total", value: formatPrice(Number(order.subtotal)) },
                      { label: "Commission plateforme", value: formatPrice(Number(order.platformFee)) },
                      { label: "Frais de livraison", value: formatPrice(Number(order.shippingCost || 0)) },
                      { label: "Montant vendeur", value: formatPrice(Number(order.vendorAmount)) },
                      { label: "ID Commande", value: order.id.slice(0, 12) + "…" },
                      { label: "PaymentIntent", value: order.stripePaymentIntentId ? order.stripePaymentIntentId.slice(0, 16) + "…" : "—" },
                      { label: "Confirmé le", value: order.confirmedAt ? formatDate(order.confirmedAt) : "Non confirmé" },
                      { label: "Fonds libérés le", value: order.fundsReleasedAt ? formatDate(order.fundsReleasedAt) : "—" },
                    ].map((item) => (
                      <div key={item.label}>
                        <dt className="text-xs text-muted-foreground">{item.label}</dt>
                        <dd className="font-medium mt-0.5">{item.value}</dd>
                      </div>
                    ))}
                  </div>

                  {/* Auto-éligibilité info */}
                  {order.status === "SHIPPED" && order.daysShipped != null && (
                    <div className={`rounded-sm border p-4 text-sm flex items-start gap-3 ${
                      order.isAutoEligible
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}>
                      <Clock className={`h-4 w-4 shrink-0 mt-0.5 ${order.isAutoEligible ? "text-emerald-600" : "text-amber-600"}`} />
                      <div>
                        {order.isAutoEligible ? (
                          <>
                            <p className="font-medium text-emerald-800">Auto-éligible à la libération</p>
                            <p className="text-emerald-700 mt-0.5">
                              Expédié il y a {order.daysShipped} jours — aucun litige signalé par l&apos;acheteur.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-medium text-amber-800">En attente de confirmation</p>
                            <p className="text-amber-700 mt-0.5">
                              Expédié il y a {order.daysShipped} jour{order.daysShipped > 1 ? "s" : ""}.
                              Auto-éligible dans {10 - order.daysShipped} jour{10 - order.daysShipped > 1 ? "s" : ""} si aucun litige.
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Infos paiement vendeur — affiché quand libération possible */}
                  {canRelease(order) && (
                    order.vendorStripeConnected ? (
                      <div className="rounded-sm border border-emerald-200 bg-emerald-50 p-4 text-sm flex items-start gap-3">
                        <Zap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-emerald-800">Stripe Connect activé</p>
                          <p className="text-emerald-700 mt-0.5">
                            Le virement de {formatPrice(Number(order.vendorAmount))} sera effectué automatiquement vers le compte Stripe du vendeur.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-sm border border-amber-200 bg-amber-50 p-4 text-sm">
                        <p className="font-medium text-amber-800 mb-2">Coordonnées bancaires du vendeur</p>
                        {order.vendorIban ? (
                          <dl className="space-y-1 text-amber-700">
                            <div className="flex gap-2">
                              <dt className="font-medium w-24 shrink-0">IBAN :</dt>
                              <dd className="font-mono">{order.vendorIban}</dd>
                            </div>
                            {order.vendorBic && (
                              <div className="flex gap-2">
                                <dt className="font-medium w-24 shrink-0">BIC/SWIFT :</dt>
                                <dd className="font-mono">{order.vendorBic}</dd>
                              </div>
                            )}
                            {order.vendorBankName && (
                              <div className="flex gap-2">
                                <dt className="font-medium w-24 shrink-0">Banque :</dt>
                                <dd>{order.vendorBankName}</dd>
                              </div>
                            )}
                          </dl>
                        ) : (
                          <p className="text-amber-700 italic">Le vendeur n&apos;a pas encore renseigné son IBAN.</p>
                        )}
                        <p className="mt-2 text-xs text-amber-600">
                          Après avoir cliqué sur &quot;Libérer&quot;, effectuez le virement SEPA manuellement.
                        </p>
                      </div>
                    )
                  )}

                  {canRelease(order) && (
                    <div className="pt-2 flex items-center justify-end">
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleRelease(order.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                        Libérer {formatPrice(Number(order.vendorAmount))} au vendeur
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
