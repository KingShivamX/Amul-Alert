# Amul Product Availability Monitor

## 1. Project Overview

The **Amul Product Availability Monitor** is a personal web application that automatically checks the availability of selected products on the Amul online store.

The system will monitor around **4–5 Amul products** and check their availability every **30 minutes**.

If a monitored product becomes available, the system will send a **WhatsApp notification** to the user.

The website will be used by **only one user**, so no user registration or multi-user functionality is required.

---

# 2. Objective

The system should:

* Monitor 4–5 selected Amul products.
* Check product availability automatically every 10 minutes.
* Allow the user to turn monitoring ON/OFF for each product.
* Detect whether a product is available or sold out.
* Send a WhatsApp notification when a monitored product is available.
* Continue monitoring even when the website is closed.
* Store product status and monitoring settings in MongoDB.
* Deploy the dashboard on Vercel.
* Use free services wherever possible with a target cost of **₹0/month**.

---

# 3. Main Features

## 3.1 Dashboard

The website will contain a simple dashboard showing all monitored products.

For each product, the dashboard will display:

* Product name
* Product image
* Current availability
* Monitoring ON/OFF toggle
* Last checked time
* Last available time
* Link to the Amul product page

Example:

| Product                 | Status          | Monitoring |
| ----------------------- | --------------- | ---------- |
| High Protein Rose Lassi | 🔴 Out of Stock | ON         |
| High Protein Buttermilk | 🟢 Available    | ON         |
| High Protein Milk       | 🔴 Out of Stock | OFF        |

---

# 4. Product Monitoring

The system will initially contain **4–5 predefined Amul product URLs**.

Every 10 minutes, the monitoring process will:

1. Get products where monitoring is ON.
2. Request the Amul product page.
3. Read the availability information from the HTML.
4. Determine the current stock status.
5. Update MongoDB.
6. Send a WhatsApp notification if the product is available.

The website itself does **not** need to remain open.

---

# 5. Amul Availability Detection

## 5.1 HTML Analysis

The provided Amul HTML files show that the product page contains structured product information.

For example, the available product contains:

```html
<link itemprop="availability"
      href="https://schema.org/InStock">
In Stock
```

The provided `available.html` file contains this `InStock` value for an Amul product.

The sold-out product contains:

```html
<link itemprop="availability"
      href="https://schema.org/OutOfStock">
Out of Stock
```

The provided `soldout.html` file contains this `OutOfStock` value for the Amul High Protein Rose Lassi.

Therefore, the initial stock detection method will be based on the structured:

```text
itemprop="availability"
```

field.

---

## 5.2 Availability Logic

The backend will parse the product page and determine:

```text
InStock
    ↓
🟢 AVAILABLE
```

```text
OutOfStock
    ↓
🔴 OUT OF STOCK
```

```text
Missing / Unknown
    ↓
🟡 UNKNOWN
```

The system should use an HTML parser such as **Cheerio** instead of relying only on visible text.

Conceptually:

```javascript
const availability =
    $('link[itemprop="availability"]').attr('href');

if (availability === 'https://schema.org/InStock') {
    return 'AVAILABLE';
}

if (availability === 'https://schema.org/OutOfStock') {
    return 'OUT_OF_STOCK';
}

return 'UNKNOWN';
```

---

# 6. Product Information Available From Amul

The provided HTML also contains structured information including:

* Product ID
* Product name
* Product image
* SKU
* Price
* Availability
* Product URL
* Brand
* Ratings

For example, the Rose Lassi HTML contains the product name, SKU, price and `OutOfStock` information.

The available HTML also contains product URLs such as:

```text
/product/amul-high-protein-buttermilk-200-ml-or-pack-of-30
```

for the High Protein Buttermilk product.

The system can therefore store useful product information in MongoDB rather than hard-coding everything in the frontend.

---

# 7. Important Location Requirement

The provided Amul HTML shows a selected delivery location:

```text
pune-br, 412105
```

This indicates that Amul's website uses a delivery pincode/location.

Therefore, availability may depend on the selected delivery location.

The first technical test must verify whether a normal server-side request to an Amul product URL returns the same availability information as the user's browser.

### If normal HTTP request works:

```text
Server
  ↓
Fetch Amul page
  ↓
Read itemprop="availability"
  ↓
Get stock status
```

### If normal HTTP request does not work:

The implementation will need to investigate the requests/API used by Amul to determine availability for the selected pincode.

This will be tested before finalizing the monitoring implementation.

---

# 8. Monitoring Toggle

The user can turn monitoring ON/OFF for every product.

### Monitoring ON

```text
Product
   ↓
Checked every 10 minutes
   ↓
WhatsApp notifications enabled
```

### Monitoring OFF

```text
Product
   ↓
Not checked
   ↓
No WhatsApp notification
```

---

# 9. WhatsApp Notification

When a monitored product is available, the system will send a WhatsApp message to the user's personal WhatsApp number.

Example:

```text
🚨 AMUL STOCK ALERT

🥛 Amul High Protein Rose Lassi

STATUS: AVAILABLE NOW

Buy:
[Amul Product Link]

Checked: 12:10 AM
```

The WhatsApp solution should be free for personal use so that the project can target ₹0/month.

---

# 10. Notification Behaviour

Recommended behaviour:

### Product is OUT OF STOCK

```text
Keep checking every 10 minutes.
```

### Product becomes AVAILABLE

```text
Send WhatsApp notification.
```

### Product remains AVAILABLE

If repeated alerts are enabled:

```text
10:00 → WhatsApp notification
10:10 → WhatsApp notification
10:20 → WhatsApp notification
...
```

The user can turn monitoring OFF at any time.

---

# 11. Automatic Monitoring

The monitoring process must work independently of the website.

The website is only the **control dashboard**.

The actual monitoring process will run in the backend.

```text
Website
   ↓
MongoDB
   ↓
Scheduled monitoring
   ↓
Amul
   ↓
Availability check
   ↓
WhatsApp
```

---

# 12. System Flow

```text
                    SCHEDULER
                        │
                  Every 10 minutes
                        │
                        ▼
               Get monitored products
                   from MongoDB
                        │
                        ▼
                 Request Amul page
                        │
                        ▼
             Parse availability field
                        │
              ┌─────────┼─────────┐
              ▼         ▼         ▼
           InStock   OutOfStock  Unknown
              │         │         │
              ▼         ▼         ▼
          AVAILABLE   SOLD OUT   UNKNOWN
              │         │
              ▼         │
        WhatsApp Alert │
              │         │
              └────┬────┘
                   ▼
             Update MongoDB
```

---

# 13. MongoDB Database

MongoDB Atlas will be used as the database.

## Products Collection

```text
products

_id
name
url
image
sku
price
isMonitoring
availability
lastChecked
lastAvailable
lastNotification
createdAt
updatedAt
```

Example:

```javascript
{
    name: "Amul High Protein Rose Lassi",
    url: "https://shop.amul.com/product/...",
    isMonitoring: true,
    availability: "OUT_OF_STOCK",
    lastChecked: "2026-08-19T00:10:00",
    lastAvailable: null
}
```

---

# 14. Notification Logs

A notification log can be stored to keep track of messages.

```text
notifications

_id
productId
status
sentAt
message
error
```

This is useful for debugging and checking whether WhatsApp notifications were successfully sent.

---

# 15. Backend APIs

The application will have simple backend endpoints.

### `GET /api/products`

Returns the monitored products.

### `PATCH /api/products/:id`

Turns monitoring ON/OFF.

### `GET /api/monitor`

Runs the product availability checker.

This endpoint will be called by the scheduler.

### Internal WhatsApp function

Sends the WhatsApp notification when required.

---

# 16. Scheduler

The system requires a scheduled process that executes approximately every **10 minutes**.

```text
00:00 → Check
00:10 → Check
00:20 → Check
00:30 → Check
...
```

The scheduler will call:

```text
/api/monitor
```

A free external scheduler will be preferred because the project should target **₹0/month**.

---

# 17. Technology Stack

| Component   | Technology                          |
| ----------- | ----------------------------------- |
| Frontend    | Next.js + React                     |
| Styling     | Tailwind CSS                        |
| Backend     | Next.js API Routes                  |
| Database    | MongoDB Atlas                       |
| HTML Parser | Cheerio                             |
| Hosting     | Vercel                              |
| Scheduler   | Free external scheduler             |
| WhatsApp    | Free personal-use WhatsApp solution |
| Source Code | GitHub                              |

---

# 18. Security

Since this is a personal application:

* No user registration is required.
* No login system is required initially.
* WhatsApp credentials/API keys must be stored as environment variables.
* MongoDB credentials must be stored as environment variables.
* Secrets must never be exposed to the frontend.
* The monitoring API should be protected with a secret token so random users cannot trigger it.

---

# 19. Error Handling

## Amul website unavailable

```text
Status = UNKNOWN
```

The system should retry during the next monitoring cycle.

## Availability field missing

```text
Status = UNKNOWN
```

The system should not send a false "Available" notification.

## WhatsApp failure

The system should:

1. Record the failure.
2. Continue monitoring.
3. Retry during a later monitoring cycle.

## Database failure

The monitoring process should fail safely and try again during the next scheduled execution.

---

# 20. MVP

The first version should contain only:

* [ ] Next.js dashboard
* [ ] 4–5 predefined Amul products
* [ ] MongoDB Atlas
* [ ] Product availability checking
* [ ] `InStock` / `OutOfStock` detection
* [ ] ON/OFF monitoring
* [ ] 10-minute scheduler
* [ ] WhatsApp notification
* [ ] Last checked time
* [ ] Last available time
* [ ] Product links
* [ ] Basic error handling
* [ ] Vercel deployment

---

# 21. Initial Technical Testing

Before building the complete application, the following should be tested:

### Test 1 — Fetch Amul page

```text
Server
 ↓
fetch(productURL)
 ↓
HTML response?
```

### Test 2 — Parse availability

```text
link[itemprop="availability"]
```

Expected:

```text
https://schema.org/InStock
```

or

```text
https://schema.org/OutOfStock
```

### Test 3 — Compare with provided files

The provided files already give us test cases:

```text
available.html
     ↓
Expected: AVAILABLE
```

```text
soldout.html
     ↓
Expected: OUT_OF_STOCK
```

### Test 4 — Test location dependency

Check whether the availability result changes depending on the Amul delivery pincode.

Only after these tests pass should the production monitoring system be implemented.

---

# 22. Success Criteria

The project is successful when:

1. The website is deployed on Vercel.
2. The user can see all configured Amul products.
3. The user can turn monitoring ON/OFF for each product.
4. The backend checks monitored products every 10 minutes.
5. The system correctly detects `InStock` and `OutOfStock`.
6. WhatsApp notification is received when a monitored product becomes available.
7. Monitoring continues even when the website is closed.
8. MongoDB stores the latest product status.
9. The application handles Amul/request failures safely.
10. The project operates using free services with a target cost of **₹0/month**.

---

# 23. Final Architecture

```text
                         ┌──────────────────┐
                         │      USER        │
                         │  Phone / Browser │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     VERCEL       │
                         │ Next.js Dashboard│
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │     MONGODB      │
                         │      ATLAS       │
                         └────────┬─────────┘
                                  ▲
                                  │
                         ┌────────┴─────────┐
                         │  FREE SCHEDULER  │
                         │    Every 10 min  │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  MONITORING API  │
                         │  Next.js Backend │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   AMUL WEBSITE   │
                         │                  │
                         │ itemprop=        │
                         │ "availability"   │
                         └────────┬─────────┘
                                  │
                         InStock / OutOfStock
                                  │
                                  ▼
                         ┌──────────────────┐
                         │    WHATSAPP      │
                         │    NOTIFICATION  │
                         └────────┬─────────┘
                                  │
                                  ▼
                              📱 USER
```

## Target

**Personal use only • 4–5 products • Every 10 minutes • WhatsApp alerts • MongoDB • Vercel • ₹0/month target**

**Important technical finding:** the supplied Amul HTML gives us a concrete stock-status field to parse (`itemprop="availability"`), with separate `InStock` and `OutOfStock` examples.
