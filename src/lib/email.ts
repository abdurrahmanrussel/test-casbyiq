import { Resend } from "resend"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.EMAIL_FROM ?? "onboarding@resend.dev"

export async function sendVerificationEmail({
  email,
  token,
}: {
  email: string
  token: string
}) {
  const verifyUrl = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Verify your KasbyIQ account",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1916;">
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 24px;">
          Kasby<span style="color: #639922;">IQ</span>
        </div>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
          Thanks for signing up. Please verify your email address to activate your account.
        </p>
        <a href="${verifyUrl}" style="display: inline-block; background: #1a1916; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
          Verify email address
        </a>
        <p style="font-size: 12px; color: #9c9b97; margin-top: 32px;">
          This link expires in 24 hours. If you did not create a KasbyIQ account, you can ignore this email.
        </p>
      </div>
    `,
  })
}

export async function sendInvitationEmail({
  agentEmail,
  brokerEmail,
  token,
}: {
  agentEmail: string
  brokerEmail: string
  token: string
}) {
  const acceptUrl = `${process.env.BASE_URL}/invitation/accept?token=${token}`

  await getResend().emails.send({
    from: FROM,
    to: agentEmail,
    subject: `${brokerEmail} invited you to connect on KasbyIQ`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1a1916;">
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 24px;">
          Kasby<span style="color: #639922;">IQ</span>
        </div>
        <p style="font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
          <strong>${brokerEmail}</strong> has invited you to share your KasbyIQ fit profile with their brokerage.
        </p>
        <p style="font-size: 14px; color: #6b6a66; line-height: 1.6; margin-bottom: 32px;">
          Accepting lets your broker see your dimension scores and support your growth. You can decline if you'd prefer not to share.
        </p>
        <a href="${acceptUrl}" style="display: inline-block; background: #1a1916; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500;">
          Accept invitation
        </a>
        <p style="font-size: 12px; color: #9c9b97; margin-top: 32px;">
          This invitation expires in 7 days. If you did not expect this email, you can ignore it.
        </p>
      </div>
    `,
  })
}
