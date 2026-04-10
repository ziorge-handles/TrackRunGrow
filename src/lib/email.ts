import sgMail from '@sendgrid/mail'

let _initialized = false

function initSendGrid(): void {
  if (_initialized) return
  const key = process.env.SENDGRID_API_KEY
  if (!key) {
    console.warn('SENDGRID_API_KEY is not set — emails will not be sent')
    return
  }
  sgMail.setApiKey(key)
  _initialized = true
}

const FROM = process.env.SENDGRID_FROM_EMAIL || 'TrackRunGrow <ryanmelvin1200@gmail.com>'

function baseTemplate(title: string, headerColor: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin:0; padding:0; background:#f9fafb; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; }
    .wrapper { max-width:600px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.1); }
    .header { background:${headerColor}; padding:36px 40px; text-align:center; }
    .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; }
    .header p { color:rgba(255,255,255,0.75); margin:6px 0 0; font-size:13px; }
    .body { padding:40px; }
    .body h2 { color:#111827; font-size:20px; margin:0 0 12px; }
    .body p { color:#6b7280; font-size:15px; line-height:1.65; margin:0 0 16px; }
    .cta-btn { display:inline-block; background:#059669; color:#fff; text-decoration:none; padding:13px 32px; border-radius:8px; font-weight:600; font-size:15px; }
    .divider { border:none; border-top:1px solid #f3f4f6; margin:24px 0; }
    .small { color:#9ca3af; font-size:12px; word-break:break-all; }
    .footer { background:#f9fafb; padding:20px 40px; text-align:center; color:#9ca3af; font-size:12px; }
    .badge { display:inline-block; background:#ecfdf5; border:1px solid #6ee7b7; color:#065f46; border-radius:8px; padding:10px 18px; font-weight:600; font-size:15px; margin:8px 0 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>TrackRunGrow</h1>
      <p>The complete coaching platform for XC &amp; Track</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} TrackRunGrow &mdash; Built for coaches, by coaches.
    </div>
  </div>
</body>
</html>`.trim()
}

export async function sendTeamInvitation({
  to,
  teamName,
  inviterName,
  inviteUrl,
}: {
  to: string
  teamName: string
  inviterName: string
  inviteUrl: string
}): Promise<void> {
  initSendGrid()
  if (!process.env.SENDGRID_API_KEY) return

  const html = baseTemplate(
    'Team Invitation',
    'linear-gradient(135deg, #065f46, #059669)',
    `
    <h2>You've been invited to join a team!</h2>
    <p><strong>${inviterName}</strong> has invited you to join:</p>
    <div class="badge">${teamName}</div>
    <p>Click the button below to accept your invitation and get started. This invitation expires in 7 days.</p>
    <p style="text-align:center;margin-bottom:28px"><a href="${inviteUrl}" class="cta-btn">Accept Invitation</a></p>
    <hr class="divider" />
    <p class="small">If the button doesn't work, copy and paste this link into your browser:<br />${inviteUrl}</p>
    <p class="small">If you weren't expecting this invitation, you can safely ignore this email.</p>
  `,
  )

  await sgMail.send({ from: FROM, to, subject: `You've been invited to join ${teamName} on TrackRunGrow`, html })
}

export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string
  name: string
}): Promise<void> {
  initSendGrid()
  if (!process.env.SENDGRID_API_KEY) return

  const html = baseTemplate(
    'Welcome to TrackRunGrow',
    'linear-gradient(135deg, #1e3a8a, #3b82f6)',
    `
    <h2>Welcome to TrackRunGrow, ${name}!</h2>
    <p>Your account is all set up and ready to go. Whether you're a coach managing a full roster or an athlete tracking your progress, TrackRunGrow has everything you need.</p>
    <ul style="color:#6b7280;font-size:15px;line-height:2;margin:0 0 20px;padding-left:20px">
      <li>Track races, workouts, and personal bests</li>
      <li>View AI-generated training plans</li>
      <li>Communicate with your team</li>
      <li>Manage fees and documents</li>
    </ul>
    <p style="text-align:center;margin-bottom:28px"><a href="${process.env.NEXTAUTH_URL ?? 'https://trackrungrow.com'}/dashboard" class="cta-btn" style="background:#3b82f6">Go to Dashboard</a></p>
  `,
  )

  await sgMail.send({ from: FROM, to, subject: 'Welcome to TrackRunGrow!', html })
}

export async function sendMfaCode({
  to,
  code,
}: {
  to: string
  code: string
}): Promise<void> {
  initSendGrid()
  if (!process.env.SENDGRID_API_KEY) return

  const html = baseTemplate(
    'Your Verification Code',
    'linear-gradient(135deg, #7c3aed, #a78bfa)',
    `
    <h2>Your Verification Code</h2>
    <p>Use the following code to complete your sign-in. This code expires in <strong>10 minutes</strong>.</p>
    <div style="text-align:center;margin:28px 0">
      <div style="display:inline-block;background:#f5f3ff;border:2px solid #7c3aed;border-radius:12px;padding:20px 40px">
        <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#4c1d95;font-family:monospace">${code}</span>
      </div>
    </div>
    <p>If you didn't request this code, please secure your account immediately by changing your password.</p>
    <p class="small">This code is valid for 10 minutes and can only be used once.</p>
  `,
  )

  await sgMail.send({ from: FROM, to, subject: 'TrackRunGrow — Your verification code', html })
}

export async function sendFeeReminder({
  to,
  athleteName,
  feeName,
  amount,
  dueDate,
}: {
  to: string
  athleteName: string
  feeName: string
  amount: number
  dueDate: string
}): Promise<void> {
  initSendGrid()
  if (!process.env.SENDGRID_API_KEY) return

  const dollars = (amount / 100).toFixed(2)

  const html = baseTemplate(
    'Fee Payment Reminder',
    'linear-gradient(135deg, #b45309, #f59e0b)',
    `
    <h2>Payment Reminder for ${athleteName}</h2>
    <p>This is a friendly reminder that a team fee payment is due:</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0 24px">
      <tr style="background:#fffbeb">
        <td style="padding:12px 16px;border:1px solid #fde68a;font-weight:600;color:#78350f">Fee</td>
        <td style="padding:12px 16px;border:1px solid #fde68a;color:#92400e">${feeName}</td>
      </tr>
      <tr>
        <td style="padding:12px 16px;border:1px solid #fde68a;font-weight:600;color:#78350f">Amount Due</td>
        <td style="padding:12px 16px;border:1px solid #fde68a;color:#92400e">$${dollars}</td>
      </tr>
      <tr style="background:#fffbeb">
        <td style="padding:12px 16px;border:1px solid #fde68a;font-weight:600;color:#78350f">Due Date</td>
        <td style="padding:12px 16px;border:1px solid #fde68a;color:#92400e">${dueDate}</td>
      </tr>
    </table>
    <p style="text-align:center;margin-bottom:28px"><a href="${process.env.NEXTAUTH_URL ?? 'https://trackrungrow.com'}/dashboard/fees" class="cta-btn" style="background:#d97706">Pay Now</a></p>
    <p class="small">If you have already paid or have questions, please contact your coach directly.</p>
  `,
  )

  await sgMail.send({ from: FROM, to, subject: `Fee reminder: ${feeName} — $${dollars} due ${dueDate}`, html })
}

export async function sendPasswordResetEmail({ to, resetUrl }: { to: string; resetUrl: string }): Promise<void> {
  initSendGrid()
  if (!process.env.SENDGRID_API_KEY) return

  const html = baseTemplate(
    'Reset Your Password',
    'linear-gradient(135deg, #dc2626, #f87171)',
    `
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password. Click the button below to create a new password.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${resetUrl}" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Reset Password</a>
    </div>
    <p>This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.</p>
    <p class="small">If the button doesn't work, copy and paste this URL into your browser: ${resetUrl}</p>
  `)

  await sgMail.send({ from: FROM, to, subject: 'TrackRunGrow — Reset your password', html })
}

export async function sendVerificationEmail({ to, verifyUrl }: { to: string; verifyUrl: string }): Promise<void> {
  initSendGrid()
  if (!process.env.SENDGRID_API_KEY) return

  const html = baseTemplate(
    'Verify Your Email',
    'linear-gradient(135deg, #059669, #34d399)',
    `
    <h2>Verify Your Email Address</h2>
    <p>Thanks for signing up! Please verify your email address to activate your account.</p>
    <div style="text-align:center;margin:28px 0">
      <a href="${verifyUrl}" style="display:inline-block;background:#059669;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px">Verify Email</a>
    </div>
    <p>This link expires in <strong>24 hours</strong>.</p>
  `)

  await sgMail.send({ from: FROM, to, subject: 'TrackRunGrow — Verify your email', html })
}

export async function sendMessageNotification({
  to,
  senderName,
  teamName,
  subject,
}: {
  to: string
  senderName: string
  teamName: string
  subject: string
}): Promise<void> {
  initSendGrid()
  if (!process.env.SENDGRID_API_KEY) return

  const html = baseTemplate(
    'New Message',
    'linear-gradient(135deg, #0f172a, #1e40af)',
    `
    <h2>New message from ${senderName}</h2>
    <p>You have a new message in <strong>${teamName}</strong>:</p>
    <div style="background:#f8fafc;border-left:4px solid #3b82f6;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0 24px">
      <p style="margin:0;color:#374151;font-style:italic">"${subject}"</p>
    </div>
    <p style="text-align:center;margin-bottom:28px"><a href="${process.env.NEXTAUTH_URL ?? 'https://trackrungrow.com'}/dashboard/messages" class="cta-btn" style="background:#1d4ed8">View Message</a></p>
    <p class="small">You're receiving this because you're a member of ${teamName} on TrackRunGrow.</p>
  `,
  )

  await sgMail.send({ from: FROM, to, subject: `New message from ${senderName}: ${subject}`, html })
}
