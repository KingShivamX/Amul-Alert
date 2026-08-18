import nodemailer from "nodemailer";

export interface AvailableProductItem {
  name: string;
  url: string;
  price?: string;
  image?: string;
}

export async function sendBulkStockAlertEmail(availableProducts: AvailableProductItem[]) {
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const RECIPIENT = process.env.ALERT_RECIPIENT_EMAIL || EMAIL_USER;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variables.");
  }

  if (availableProducts.length === 0) return null;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const timeString = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const count = availableProducts.length;

  const itemsHtml = availableProducts
    .map(
      (prod) => `
      <div style="background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 18px; margin-bottom: 16px;">
        <span style="display: inline-block; background: #22c55e; color: #052e16; font-weight: bold; padding: 4px 10px; border-radius: 12px; font-size: 11px; text-transform: uppercase; margin-bottom: 10px;">🟢 IN STOCK NOW</span>
        <div style="font-size: 18px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">${prod.name}</div>
        ${prod.price ? `<div style="font-size: 16px; color: #fbbf24; font-weight: bold; margin-bottom: 14px;">Price: ${prod.price}</div>` : ""}
        <a href="${prod.url}" target="_blank" style="display: inline-block; width: 100%; text-align: center; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 16px; border-radius: 8px; font-weight: bold; font-size: 14px; box-sizing: border-box;">🛒 Buy Now on Amul Store</a>
      </div>
    `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #090d16; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #16a34a, #15803d); padding: 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 0.5px; }
        .body { padding: 24px; }
        .summary { color: #cbd5e1; font-size: 15px; margin-bottom: 20px; line-height: 1.5; }
        .footer { padding: 16px 24px; background: #0f172a; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 AMUL STOCK ALERT (${count} Available)</h1>
        </div>
        <div class="body">
          <p class="summary">
            Good news! The following <strong>${count} monitored Amul product${count > 1 ? "s are" : " is"}</strong> currently available in stock!
          </p>
          ${itemsHtml}
        </div>
        <div class="footer">
          Checked & Sent at ${timeString} IST • Amul Availability Monitor
        </div>
      </div>
    </body>
    </html>
  `;

  const subjectText =
    count === 1
      ? `🟢 BACK IN STOCK: ${availableProducts[0].name}`
      : `🟢 ${count} AMUL PRODUCTS BACK IN STOCK NOW!`;

  const mailOptions = {
    from: `"Amul Alert System" <${EMAIL_USER}>`,
    to: RECIPIENT,
    subject: subjectText,
    text: `🚨 AMUL STOCK ALERT!\n\n${count} product(s) in stock now:\n${availableProducts
      .map((p) => `- ${p.name}: ${p.url}`)
      .join("\n")}\n\nChecked at ${timeString}`,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
