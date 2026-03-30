import resend from "@/lib/api/models/resend";

async function sendReportEmail(to: string, subject: string, html: string): Promise<{ id: string }> {
  const { data, error } = await resend.emails.send({
    from: "Nudge Panel Experts <noreply@agentbloom.io>",
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data!;
}

export default sendReportEmail;
