import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export async function sendReportEmail(
  to: string,
  subject: string,
  html: string,
) {
  const resend = getResend();
  const { data, error } = await resend.emails.send({
    from: "Nudge Panel Experts <noreply@resend.dev>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
