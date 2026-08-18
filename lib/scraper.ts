import * as cheerio from "cheerio";
import axios from "axios";

export interface ScrapedProductData {
  name: string;
  availability: "AVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN";
  image?: string;
  price?: string;
}

export function parseAmulHtml(html: string): ScrapedProductData {
  const $ = cheerio.load(html);

  // 1. Availability Detection via Schema.org microdata (as specified in SRS)
  const availabilityHref = $('link[itemprop="availability"]').attr("href") || "";
  let availability: "AVAILABLE" | "OUT_OF_STOCK" | "UNKNOWN" = "UNKNOWN";

  if (availabilityHref.includes("InStock")) {
    availability = "AVAILABLE";
  } else if (availabilityHref.includes("OutOfStock")) {
    availability = "OUT_OF_STOCK";
  } else {
    // Fallback checks on body text or buttons if schema tags missing
    const pageText = $("body").text().toLowerCase();
    if (pageText.includes("add to cart") || pageText.includes("buy now") || pageText.includes("in stock")) {
      availability = "AVAILABLE";
    } else if (pageText.includes("out of stock") || pageText.includes("sold out") || pageText.includes("currently unavailable")) {
      availability = "OUT_OF_STOCK";
    }
  }

  // 2. Product Name
  let name = $('meta[property="og:title"]').attr("content") ||
             $('[itemprop="name"]').text().trim() ||
             $("h1").first().text().trim() ||
             "Amul Product";

  // Clean name if necessary
  name = name.replace(/\|\s*Amul.*/i, "").trim();

  // 3. Product Image
  const image = $('meta[property="og:image"]').attr("content") ||
                $('[itemprop="image"]').attr("src") ||
                $("img.product-image").attr("src") ||
                "";

  // 4. Product Price
  const price = $('[itemprop="price"]').attr("content") ||
                $('[itemprop="price"]').text().trim() ||
                $(".product-price").text().trim() ||
                "";

  return {
    name,
    availability,
    image,
    price,
  };
}

export async function fetchAndScrapeProduct(url: string): Promise<ScrapedProductData> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      timeout: 12000,
    });

    return parseAmulHtml(response.data);
  } catch (error: any) {
    console.error(`Error scraping URL ${url}:`, error?.message || error);
    return {
      name: "Amul Product",
      availability: "UNKNOWN",
    };
  }
}
