import { env } from '../config/env';
import { ServiceError } from '../errors/ServiceError';

interface AuthEmailParams {
  email: string;
  token: string;
}

interface OrderConfirmationItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface OrderConfirmationParams {
  email: string;
  orderId: string;
  createdAt: Date;
  status: string;
  items: OrderConfirmationItem[];
  total: number;
}

interface StaffInviteEmailParams {
  email: string;
  role: string;
  token: string;
}

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatCurrency = (value: number) => {
  return `￥${value.toFixed(2)}`;
};

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

export const sendOrderConfirmationEmail = async ({
  email,
  orderId,
  createdAt,
  status,
  items,
  total,
}: OrderConfirmationParams) => {
  const orderUrl = `${env.FRONTEND_URL}/orders/${orderId}`;
  const orderNumber = orderId.slice(-6).toUpperCase();
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #ead8b5">${escapeHtml(
            item.name,
          )}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ead8b5;text-align:center">${item.quantity}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ead8b5;text-align:right">${formatCurrency(
            item.price,
          )}</td>
          <td style="padding:10px 0;border-bottom:1px solid #ead8b5;text-align:right;font-weight:700">${formatCurrency(
            item.subtotal,
          )}</td>
        </tr>
      `,
    )
    .join('');

  await sendEmail({
    to: email,
    subject: `Burger Club order #${orderNumber} confirmed`,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#292929">
        <h1>Order confirmed</h1>
        <p>Thanks for your order. We have saved the details below for your records.</p>
        <p><strong>Order:</strong> #${orderNumber}</p>
        <p><strong>Placed:</strong> ${createdAt.toLocaleString()}</p>
        <p><strong>Status:</strong> ${escapeHtml(status)}</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr>
              <th style="padding:0 0 8px;text-align:left;border-bottom:2px solid #bd0017">Item</th>
              <th style="padding:0 0 8px;text-align:center;border-bottom:2px solid #bd0017">Qty</th>
              <th style="padding:0 0 8px;text-align:right;border-bottom:2px solid #bd0017">Price</th>
              <th style="padding:0 0 8px;text-align:right;border-bottom:2px solid #bd0017">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <p style="font-size:18px"><strong>Total: ${formatCurrency(total)}</strong></p>
        <p><a href="${orderUrl}" style="display:inline-block;background:#ffc72c;color:#292929;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">View order</a></p>
        <p>If the button does not work, open this link:</p>
        <p>${orderUrl}</p>
      </div>
    `,
  });
};

export const sendStaffInviteEmail = async ({
  email,
  role,
  token,
}: StaffInviteEmailParams) => {
  const inviteUrl = `${env.FRONTEND_URL}/admin/invitations/accept?token=${token}`;

  await sendEmail({
    to: email,
    subject: 'You have been invited to Burger Club admin',
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.5;color:#292929">
        <h1>Admin invitation</h1>
        <p>You have been invited to join Burger Club as <strong>${escapeHtml(
          role,
        )}</strong>.</p>
        <p>This invite expires in 7 days. Sign in with this email address to accept it.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;background:#ffc72c;color:#292929;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Accept invite</a></p>
        <p>If the button does not work, open this link:</p>
        <p>${inviteUrl}</p>
      </div>
    `,
  });
};
