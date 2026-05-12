import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';

interface AuthEmailParams {
  email: string;
  token: string;
}

const sendEmail = async ({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) => {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
    console.log(`[dev email] ${subject} -> ${to}`);
    console.log(html.replace(/<[^>]+>/g, ' '));
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new ServiceError(`Email send failed: ${body}`, 502);
  }
};

export const sendVerificationEmail = async ({
  email,
  token,
}: AuthEmailParams) => {
  const url = `${env.FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Verify your Burger Club email',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#292929">
        <h1>Verify your email</h1>
        <p>Confirm your Burger Club account so your profile is ready for checkout.</p>
        <p><a href="${url}" style="display:inline-block;background:#ffc72c;color:#292929;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Verify email</a></p>
        <p>If the button does not work, open this link:</p>
        <p>${url}</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async ({
  email,
  token,
}: AuthEmailParams) => {
  const url = `${env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'Reset your Burger Club password',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#292929">
        <h1>Reset your password</h1>
        <p>This link expires in 30 minutes.</p>
        <p><a href="${url}" style="display:inline-block;background:#ffc72c;color:#292929;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Reset password</a></p>
        <p>If the button does not work, open this link:</p>
        <p>${url}</p>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async ({
  email,
  name,
}: {
  email: string;
  name: string;
}) => {
  const menuUrl = `${env.FRONTEND_URL}/`;

  await sendEmail({
    to: email,
    subject: 'Welcome to Burger Club',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#292929">
        <h1>Welcome${name ? `, ${name}` : ''}!</h1>
        <p>Your Burger Club account is ready. You can now keep your cart, profile, and future orders together.</p>
        <p><a href="${menuUrl}" style="display:inline-block;background:#ffc72c;color:#292929;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Start ordering</a></p>
      </div>
    `,
  });
};
