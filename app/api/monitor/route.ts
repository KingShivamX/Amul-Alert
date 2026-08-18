import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import NotificationLog from "@/models/NotificationLog";
import { fetchAndScrapeProduct } from "@/lib/scraper";
import { sendBulkStockAlertEmail, AvailableProductItem } from "@/lib/email";

export async function GET() {
  try {
    await dbConnect();

    // Fetch products where isMonitoring is true
    const productsToMonitor = await Product.find({ isMonitoring: true });
    const results = [];
    const availableItemsToAlert: AvailableProductItem[] = [];

    const now = new Date();
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

    for (const prod of productsToMonitor) {
      console.log(`[MONITOR] Checking stock for: ${prod.name} (${prod.url})`);
      const scraped = await fetchAndScrapeProduct(prod.url);

      const oldStatus = prod.availability;
      const newStatus = scraped.availability;

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

        // Check if should be included in alert email:
        // 1) Status flipped to AVAILABLE
        // 2) Or last notification sent > 30 mins ago
        const shouldAlert =
          oldStatus !== "AVAILABLE" ||
          !prod.lastNotificationSent ||
          prod.lastNotificationSent < thirtyMinsAgo;

        if (shouldAlert) {
          availableItemsToAlert.push({
            name: prod.name,
            url: prod.url,
            price: prod.price,
            image: prod.image,
          });
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

    // Send SINGLE consolidated email if any product is available
    if (availableItemsToAlert.length > 0) {
      console.log(
        `[ALERT] ${availableItemsToAlert.length} available products found! Sending single consolidated email...`
      );
      try {
        await sendBulkStockAlertEmail(availableItemsToAlert);

        // Update lastNotificationSent for alerted products & create logs
        for (const item of availableItemsToAlert) {
          const matchedProd = productsToMonitor.find((p) => p.url === item.url);
          if (matchedProd) {
            matchedProd.lastNotificationSent = now;
            await matchedProd.save();

            await NotificationLog.create({
              productId: matchedProd._id,
              productName: matchedProd.name,
              recipientEmail: process.env.ALERT_RECIPIENT_EMAIL || process.env.EMAIL_USER,
              status: "SUCCESS",
              message: `Included in consolidated email alert for ${availableItemsToAlert.length} available items`,
              sentAt: now,
            });
          }
        }
      } catch (emailErr: any) {
        console.error(`[ALERT ERROR] Failed to send consolidated email:`, emailErr);
        for (const item of availableItemsToAlert) {
          const matchedProd = productsToMonitor.find((p) => p.url === item.url);
          if (matchedProd) {
            await NotificationLog.create({
              productId: matchedProd._id,
              productName: matchedProd.name,
              recipientEmail: process.env.ALERT_RECIPIENT_EMAIL || process.env.EMAIL_USER,
              status: "FAILED",
              message: `Failed to send email alert`,
              error: emailErr?.message || String(emailErr),
              sentAt: now,
            });
          }
        }
      }
    } else {
      console.log(`[MONITOR] No available items requiring email alerts.`);
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      checkedCount: productsToMonitor.length,
      alertedCount: availableItemsToAlert.length,
      results,
    });
  } catch (error: any) {
    console.error("[MONITOR ERROR]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
