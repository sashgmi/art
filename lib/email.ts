import { Resend } from "resend";

let _resend: Resend | null = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

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

  getResend().emails
    .send({ from: FROM, ...params })
    .catch((err) => console.error("[Email error]", params.subject, err));
}
