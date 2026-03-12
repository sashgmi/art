const GOLD = "#d4911a";
const BG = "#fafaf9";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BG};font-family:Arial,sans-serif;color:#1c1917;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BG};padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7e5e4;max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="padding:28px 32px;border-bottom:1px solid #e7e5e4;">
            <span style="font-family:Georgia,serif;font-size:20px;font-weight:600;color:#1c1917;">
              ♦ Galerie Antiquités
            </span>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:32px;">${content}</td></tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #e7e5e4;background:#fafaf9;">
            <p style="margin:0;font-size:11px;color:#78716c;text-align:center;">
              Galerie Antiquités · Plateforme de vente d'art et d'antiquités<br>
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:22px;font-weight:600;color:#1c1917;">${text}</h1>`;
}

function para(text: string): string {
  return `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#44403c;">${text}</p>`;
}

function highlight(label: string, value: string): string {
  return `<div style="margin:6px 0;font-size:13px;color:#44403c;">
    <span style="font-weight:600;color:#1c1917;">${label} :</span> ${value}
  </div>`;
}

function infoBox(content: string): string {
  return `<div style="background:#fdf9ee;border:1px solid #e8d5a3;padding:16px;margin:16px 0;">
    ${content}
  </div>`;
}

function ctaButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:${GOLD};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;">
    ${label}
  </a>`;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─────────────────────────────────────────────────────────────────────────────
// 1. Acheteur — paiement confirmé, commande en séquestre
// ─────────────────────────────────────────────────────────────────────────────
export function orderConfirmedBuyer(params: {
  buyerName: string;
  listingTitle: string;
  orderId: string;
  total: number;
}): { subject: string; html: string } {
  return {
    subject: `Commande confirmée — ${params.listingTitle}`,
    html: layout(`
      ${heading("Votre paiement a été reçu")}
      ${para(`Bonjour ${params.buyerName},`)}
      ${para("Votre paiement a bien été reçu. Les fonds sont conservés en séquestre sécurisé jusqu'à confirmation de la réception.")}
      ${infoBox(`
        ${highlight("Article", params.listingTitle)}
        ${highlight("Montant total", `${params.total.toFixed(2)} €`)}
        ${highlight("Référence", params.orderId.slice(0, 12))}
      `)}
      ${para("Le vendeur va préparer votre commande et vous communiquer un numéro de suivi dès l'expédition.")}
      ${ctaButton(`${APP_URL}/compte/commandes`, "Suivre ma commande")}
    `),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Vendeur — nouvelle vente
// ─────────────────────────────────────────────────────────────────────────────
export function newSaleVendor(params: {
  vendorName: string;
  listingTitle: string;
  orderId: string;
  vendorAmount: number;
}): { subject: string; html: string } {
  return {
    subject: `Nouvelle vente — ${params.listingTitle}`,
    html: layout(`
      ${heading("Vous avez réalisé une vente !")}
      ${para(`Bonjour ${params.vendorName},`)}
      ${para("Félicitations ! Une de vos annonces vient d'être achetée. Préparez l'envoi dès que possible.")}
      ${infoBox(`
        ${highlight("Article vendu", params.listingTitle)}
        ${highlight("Votre part (hors commission)", `${params.vendorAmount.toFixed(2)} €`)}
        ${highlight("Référence commande", params.orderId.slice(0, 12))}
      `)}
      ${para("Rendez-vous dans votre espace vendeur pour saisir le numéro de suivi une fois le colis expédié.")}
      ${ctaButton(`${APP_URL}/vendeur/ventes`, "Gérer mes ventes")}
    `),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Acheteur — commande expédiée avec numéro de suivi
// ─────────────────────────────────────────────────────────────────────────────
export function orderShippedBuyer(params: {
  buyerName: string;
  listingTitle: string;
  trackingNumber: string;
  trackingCarrier?: string;
  orderId: string;
}): { subject: string; html: string } {
  return {
    subject: `Votre commande a été expédiée — ${params.listingTitle}`,
    html: layout(`
      ${heading("Votre commande est en route !")}
      ${para(`Bonjour ${params.buyerName},`)}
      ${para("Bonne nouvelle : le vendeur vient d'expédier votre commande.")}
      ${infoBox(`
        ${highlight("Article", params.listingTitle)}
        ${params.trackingCarrier ? highlight("Transporteur", params.trackingCarrier) : ""}
        ${highlight("Numéro de suivi", `<strong style="font-family:monospace;">${params.trackingNumber}</strong>`)}
      `)}
      ${para("Dès réception, pensez à confirmer la bonne réception dans votre espace personnel. Si vous ne confirmez pas dans les <strong>10 jours</strong>, la réception sera considérée comme effectuée.")}
      ${ctaButton(`${APP_URL}/compte/commandes`, "Confirmer la réception")}
    `),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Vendeur — réception confirmée par l'acheteur
// ─────────────────────────────────────────────────────────────────────────────
export function receptionConfirmedVendor(params: {
  vendorName: string;
  listingTitle: string;
  vendorAmount: number;
  orderId: string;
}): { subject: string; html: string } {
  return {
    subject: `Réception confirmée — ${params.listingTitle}`,
    html: layout(`
      ${heading("L'acheteur a confirmé la réception")}
      ${para(`Bonjour ${params.vendorName},`)}
      ${para("L'acheteur a confirmé avoir bien reçu votre article. L'administrateur va procéder à la libération des fonds sous peu.")}
      ${infoBox(`
        ${highlight("Article", params.listingTitle)}
        ${highlight("Montant à recevoir", `${params.vendorAmount.toFixed(2)} €`)}
        ${highlight("Référence", params.orderId.slice(0, 12))}
      `)}
      ${para("Vous recevrez un email de confirmation dès que le virement aura été effectué.")}
    `),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Vendeur — fonds libérés
// ─────────────────────────────────────────────────────────────────────────────
export function fundsReleasedVendor(params: {
  vendorName: string;
  listingTitle: string;
  vendorAmount: number;
  method: "STRIPE_TRANSFER" | "MANUAL_IBAN";
  iban?: string | null;
}): { subject: string; html: string } {
  const methodText =
    params.method === "STRIPE_TRANSFER"
      ? "Le virement a été effectué automatiquement vers votre compte Stripe Express."
      : `Le virement SEPA de <strong>${params.vendorAmount.toFixed(2)} €</strong> sera effectué manuellement vers votre IBAN${params.iban ? ` (${params.iban.slice(0, 8)}…)` : ""} dans les prochains jours ouvrés.`;

  return {
    subject: `Fonds libérés — ${params.listingTitle}`,
    html: layout(`
      ${heading("Vos fonds ont été libérés")}
      ${para(`Bonjour ${params.vendorName},`)}
      ${para("La transaction est désormais finalisée.")}
      ${infoBox(`
        ${highlight("Article", params.listingTitle)}
        ${highlight("Montant libéré", `${params.vendorAmount.toFixed(2)} €`)}
      `)}
      ${para(methodText)}
      ${ctaButton(`${APP_URL}/vendeur/ventes`, "Voir mes ventes")}
    `),
  };
}
