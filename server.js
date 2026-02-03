const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function formatEnquiry(data) {
  return [
    `Full name: ${data.fullName}`,
    `Email: ${data.email}`,
    `WhatsApp: ${data.whatsapp}`,
    `Country: ${data.country}`,
    `Property location: ${data.location}`,
    `Property type: ${data.propertyType}`,
    `Units: ${data.units}`,
    `Biggest concern: ${data.concern}`,
    `Ready in 30 days: ${data.ready}`,
    `Notes: ${data.notes || "None"}`,
  ].join("\n");
}

app.post("/api/enquiry", async (req, res) => {
  const data = req.body || {};
  const requiredFields = [
    "fullName",
    "email",
    "whatsapp",
    "country",
    "location",
    "propertyType",
    "units",
    "concern",
    "ready",
  ];

  const missing = requiredFields.filter((field) => !data[field]);
  if (missing.length > 0) {
    return res.status(400).json({
      error: "Missing fields",
      fields: missing,
    });
  }

  const transport = buildTransport();
  if (!transport) {
    return res.status(503).json({
      error: "Email transport not configured",
    });
  }

  const ownerEmail = process.env.OWNER_EMAIL || "hello@homelink.example";
  const fromEmail = process.env.FROM_EMAIL || ownerEmail;
  const onboardingPack = process.env.ONBOARDING_PACK_URL || "<insert onboarding pack link>";
  const sampleReport = process.env.SAMPLE_REPORT_URL || "<insert sample report link>";
  const heroVideo = process.env.HERO_VIDEO_URL || "<insert hero video link>";

  const ownerMessage = {
    from: fromEmail,
    to: ownerEmail,
    subject: "New Homelink enquiry",
    text: formatEnquiry(data),
  };

  const clientMessage = {
    from: fromEmail,
    to: data.email,
    subject: "Homelink onboarding pack",
    text: [
      `Hello ${data.fullName},`,
      "",
      "Thank you for your enquiry. Below are the next steps and reference materials.",
      "",
      `Onboarding pack: ${onboardingPack}`,
      `Sample report: ${sampleReport}`,
      `Hero film: ${heroVideo}`,
      "",
      "We will respond with a tailored plan after reviewing your details.",
      "",
      "Homelink",
    ].join("\n"),
  };

  try {
    await transport.sendMail(ownerMessage);
    await transport.sendMail(clientMessage);
    return res.status(200).json({ status: "sent" });
  } catch (error) {
    return res.status(500).json({ error: "Unable to send email" });
  }
});

app.listen(PORT, () => {
  console.log(`Homelink server listening on port ${PORT}`);
});
