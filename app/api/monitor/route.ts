import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import NotificationLog from "@/models/NotificationLog";
import { fetchAndScrapeProduct } from "@/lib/scraper";
import { sendStockAlertEmail } from "@/lib/email";

export async function GET() {
  try {
    await dbConnect();

    // Fetch products where isMonitoring is true
    const productsToMonitor = await Product.find({ isMonitoring: true });
    const results = [];

    for (const prod of productsToMonitor) {
      console.log(`[MONITOR] Checking stock for: ${prod.name} (${prod.url})`);
      const scraped = await fetchAndScrapeProduct(prod.url);

      const oldStatus = prod.availability;
      const newStatus = scraped.availability;
      const now = new Date();

      // Update fields
      prod.availability = newStatus;
      prod.lastChecked = now;

      if (scraped.name && scraped.name !== "Amul Product") {
        prod.name = scraped.name;
      }
      if (scraped.image) prod.image = scraped.image;
      if (scraped.price) prod.price = scraped.price;

      if (newStatus === "AVAILABLE") {
        prod.lastAvailable = now;

        // Trigger Alert if:
        // 1) Status flipped from OUT_OF_STOCK / UNKNOWN to AVAILABLE
        // 2) Or last notification was sent > 30 minutes ago (prevent email spam)
        const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);
        const shouldAlert =
          oldStatus !== "AVAILABLE" ||
          !prod.lastNotificationSent ||
          prod.lastNotificationSent < thirtyMinsAgo;

        if (shouldAlert) {
          console.log(`[ALERT] Product ${prod.name} IS AVAILABLE! Sending email alert...`);
          try {
            await sendStockAlertEmail({
              productName: prod.name,
              productUrl: prod.url,
              price: prod.price,
              image: prod.image,
            });

            prod.lastNotificationSent = now;

            await NotificationLog.create({
              productId: prod._id,
              productName: prod.name,
              recipientEmail: process.env.ALERT_RECIPIENT_EMAIL || process.env.EMAIL_USER,
              status: "SUCCESS",
              message: `Email alert sent successfully for ${prod.name}`,
              sentAt: now,
            });
          } catch (emailErr: any) {
            console.error(`[ALERT ERROR] Failed to send email for ${prod.name}:`, emailErr);
            await NotificationLog.create({
              productId: prod._id,
              productName: prod.name,
              recipientEmail: process.env.ALERT_RECIPIENT_EMAIL || process.env.EMAIL_USER,
              status: "FAILED",
              message: `Failed to send email alert`,
              error: emailErr?.message || String(emailErr),
              sentAt: now,
            });
          }
        }
      }

      await prod.save();
      results.push({
        id: prod._id,
        name: prod.name,
        oldStatus,
        newStatus,
      });
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkedCount: productsToMonitor.length,
      results,
    });
  } catch (error: any) {
    console.error("[MONITOR ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
