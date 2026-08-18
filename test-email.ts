import fs from "fs";
import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { sendStockAlertEmail } from "./lib/email";

async function testEmail() {
  console.log("--- EMAIL TEST DISPATCH ---");
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  console.log("ALERT_RECIPIENT_EMAIL:", process.env.ALERT_RECIPIENT_EMAIL);

  try {
    const info = await sendStockAlertEmail({
      productName: "TEST: Amul High Protein Rose Lassi (200 ml)",
      productUrl: "https://shop.amul.com/en/product/amul-high-protein-rose-lassi-200-ml-or-pack-of-30",
      price: "₹750",
    });
    console.log("\n🎉 SUCCESS! TEST EMAIL SENT TO shivamhippalgave@gmail.com!");
    console.log("Nodemailer Message ID:", info.messageId);
  } catch (err) {
    console.error("\n❌ EMAIL DISPATCH FAILED:", err);
  }
}

testEmail();
