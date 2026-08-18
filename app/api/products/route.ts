import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import Product from "@/models/Product";
import { fetchAndScrapeProduct } from "@/lib/scraper";

const DEFAULT_PRODUCTS = [
  {
    name: "Amul High Protein Rose Lassi (200 ml | Pack of 30)",
    url: "https://shop.amul.com/en/product/amul-high-protein-rose-lassi-200-ml-or-pack-of-30",
  },
  {
    name: "Amul High Protein Buttermilk (200 ml | Pack of 30)",
    url: "https://shop.amul.com/en/product/amul-high-protein-buttermilk-200-ml-or-pack-of-30",
  },
  {
    name: "Amul High Protein Milk (250 ml | Pack of 24)",
    url: "https://shop.amul.com/en/product/amul-high-protein-milk-250ml",
  },
  {
    name: "Amul High Protein Paneer (200g)",
    url: "https://shop.amul.com/en/product/amul-high-protein-paneer-200g",
  },
];

export async function GET() {
  try {
    await dbConnect();
    let products = await Product.find({}).sort({ createdAt: -1 });

    // Seed defaults if empty
    if (products.length === 0) {
      console.log("Seeding default products into MongoDB...");
      for (const prod of DEFAULT_PRODUCTS) {
        const scraped = await fetchAndScrapeProduct(prod.url);
        await Product.create({
          name: scraped.name !== "Amul Product" ? scraped.name : prod.name,
          url: prod.url,
          image: scraped.image || "",
          price: scraped.price || "",
          availability: scraped.availability,
          isMonitoring: true,
          lastChecked: new Date(),
        });
      }
      products = await Product.find({}).sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "Valid product URL is required" }, { status: 400 });
    }

    const existing = await Product.findOne({ url });
    if (existing) {
      return NextResponse.json({ success: false, error: "Product already monitored" }, { status: 400 });
    }

    // Scrape details first
    const scraped = await fetchAndScrapeProduct(url);
    const newProduct = await Product.create({
      name: scraped.name || "Amul Monitored Product",
      url,
      image: scraped.image || "",
      price: scraped.price || "",
      availability: scraped.availability,
      isMonitoring: true,
      lastChecked: new Date(),
      lastAvailable: scraped.availability === "AVAILABLE" ? new Date() : undefined,
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
