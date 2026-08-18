const { parseAmulHtml } = require("./lib/scraper");
const fs = require("fs");
const path = require("path");

console.log("--- SCRAPER UNIT TEST ---");

const availHtml = fs.readFileSync(path.join(__dirname, "available.html"), "utf-8");
const soldoutHtml = fs.readFileSync(path.join(__dirname, "soldout.html"), "utf-8");

const availResult = parseAmulHtml(availHtml);
console.log("AVAILABLE.HTML SCRAPE RESULT:", availResult);

const soldoutResult = parseAmulHtml(soldoutHtml);
console.log("SOLDOUT.HTML SCRAPE RESULT:", soldoutResult);

if (availResult.availability === "AVAILABLE" && soldoutResult.availability === "OUT_OF_STOCK") {
  console.log("\n✅ SCRAPER TEST PASSED! Cheerio correctly parsed InStock vs OutOfStock!");
} else {
  console.error("\n❌ SCRAPER TEST FAILED!");
}
