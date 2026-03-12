import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.RESEND_FROM_EMAIL || "noreply@galerie-antiquites.fr";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Fire-and-forget email sender — ne bloque jamais la réponse API.
 * Les erreurs sont loggées mais silencieuses pour l'utilisateur.
 */
export function sendEmail(params: SendEmailParams): void {
  if (!process.env.RESEND_API_KEY) return;

  resend.emails
    .send({ from: FROM, ...params })
    .catch((err) => console.error("[Email error]", params.subject, err));
}
