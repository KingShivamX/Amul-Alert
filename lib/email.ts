import nodemailer from "nodemailer";

export async function sendStockAlertEmail({
  productName,
  productUrl,
  price,
  image,
}: {
  productName: string;
  productUrl: string;
  price?: string;
  image?: string;
}) {
  const EMAIL_USER = process.env.EMAIL_USER;
  const EMAIL_PASS = process.env.EMAIL_PASS;
  const RECIPIENT = process.env.ALERT_RECIPIENT_EMAIL || EMAIL_USER;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Missing EMAIL_USER or EMAIL_PASS environment variables.");
  }

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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #16a34a, #15803d); padding: 24px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 24px; letter-spacing: 0.5px; }
        .body { padding: 30px 24px; }
        .badge { display: inline-block; background: #22c55e; color: #052e16; font-weight: bold; padding: 6px 14px; border-radius: 20px; font-size: 13px; text-transform: uppercase; margin-bottom: 16px; }
        .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; line-height: 1.3; }
        .price { font-size: 18px; color: #fbbf24; font-weight: bold; margin-bottom: 20px; }
        .btn { display: inline-block; width: 100%; text-align: center; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-weight: bold; font-size: 16px; box-sizing: border-box; }
        .btn:hover { background: #1d4ed8; }
        .footer { padding: 16px 24px; background: #0f172a; border-top: 1px solid #334155; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 AMUL STOCK ALERT</h1>
        </div>
        <div class="body">
          <span class="badge">🟢 IN STOCK NOW</span>
          <div class="title">${productName}</div>
          ${price ? `<div class="price">Price: ${price}</div>` : ""}
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">
            Good news! Your monitored Amul product is currently back in stock. Grab it before it sells out again!
          </p>
          <a href="${productUrl}" class="btn" target="_blank">🛒 Buy Now on Amul Store</a>
        </div>
        <div class="footer">
          Checked & Sent at ${timeString} IST • Amul Availability Monitor
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Amul Alert System" <${EMAIL_USER}>`,
    to: RECIPIENT,
    subject: `🟢 BACK IN STOCK: ${productName}`,
    text: `🚨 AMUL STOCK ALERT!\n\n${productName} is back in stock!\nBuy Now: ${productUrl}\nChecked at: ${timeString}`,
    html: htmlContent,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
