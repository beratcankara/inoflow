// Basit mailer: Önce RESEND, yoksa SMTP, o da yoksa console fallback
import nodemailer from 'nodemailer';

async function sendViaResend(to: string, subject: string, html: string, from: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('Resend error:', res.status, txt);
    return false;
  }
  return true;
}

export async function sendMail(to: string, subject: string, html: string) {
  const from = process.env.MAIL_FROM || 'no-reply@inoflow.local';

  // 1) Resend ile dene
  const sentViaResend = await sendViaResend(to, subject, html, from);
  if (sentViaResend) return;

  // 2) SMTP ile dene
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to, subject, html });
    return;
  }

  // 3) Geliştirme fallback: console
  console.warn('Mail servisleri yapılandırılmadı; e-posta konsola yazdırıldı.');
  console.info('FROM:', from);
  console.info('TO:', to);
  console.info('SUBJECT:', subject);
  console.info('HTML:', html);
}


