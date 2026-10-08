# Admin-managed slab pricing for Voice Broadcasting and Bulk SMS

Date: 2026-10-08
Repos: `btcl-sms-portal` (this repo) and `Softswitch/RTC-Manager` (TelcoREST, TelcoGateway, PaymentGateWay). Nothing in `routesphere` is changed.

## Goal

An admin can change the slab pricing of two services from the admin panel, with no code change or redeploy:

- Alaap Cloud Voice Broadcasting Service (VBS)
- Bulk SMS Service

For each slab the admin controls the name (English and Bangla), the message range, the rate per message, the backend package it buys, and whether the "Conditions applicable" badge shows. The admin can edit, add, remove and reorder slabs. The payment gateway rejects any purchase whose price does not match the stored slabs.

## Decisions taken with the user

| Question | Decision |
|---|---|
| Where prices live | TelcoREST, table in `tenant_master` |
| Schema changes | In TelcoREST `SchemaInitializer`, so every developer and server gets them on startup |
| Add new slabs | Yes, and edit existing ones |
| Conditions | Badge only, no condition text |
| Payment gateway price check | Now, in this change |

## Current state (what this replaces)

- Slabs are hardcoded arrays in `src/app/[locale]/pricing/page.tsx` (`vbsSlabs`, `smsSlabs`).
- The "Conditions applicable" badge is hardcoded to the slab whose key is `premium`.
- `CheckoutModal.getPackageIdInt` maps slab keys (`basic`, `standard`, ...) to package ids.
- The homepage hardcodes "Starting from" prices. The homepage plan list, the dashboard mock list and `getPackageById.ts` carry stale SMS rates.
- PaymentGateWay checks PBX and Contact Center prices from a static map, but `package.validation.vbs` and `package.validation.sms` are blank in `application-btcl.properties`. VBS and SMS totals are accepted as sent by the browser.
- Rounding bug: the browser computes `Math.ceil(qty * rate)` in floating point. `100 * 0.28` is `28.000000000000004`, so the customer is charged ৳29 instead of ৳28. Same for `300 * 0.14` (৳43 instead of ৳42).

## Data model (TelcoREST `SchemaInitializer`)

Created only when `service-pricing.tables.enabled=true`. That property is set in `application-btcl-services.properties` (database `tenant_master`) and `application-local.properties`. The SMS and VBS profiles use their own databases and do not get these tables. All statements are `CREATE TABLE IF NOT EXISTS`, and every step logs and carries on, like the existing steps.

```sql
CREATE TABLE IF NOT EXISTS service_pricing (
    service        VARCHAR(20)   NOT NULL PRIMARY KEY,   -- 'vbs' | 'sms'
    min_total      DECIMAL(12,2) NOT NULL,               -- smallest total incl. VAT
    max_total      DECIMAL(12,2) NULL,                   -- largest total incl. VAT, NULL = none
    max_quantity   INT           NULL,                   -- largest message count, NULL = none
    updated_at     DATETIME      NOT NULL,
    updated_by     VARCHAR(255)  NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_pricing_slab (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    service          VARCHAR(20)   NOT NULL,
    sort_order       INT           NOT NULL,
    name_en          VARCHAR(100)  NOT NULL,
    name_bn          VARCHAR(100)  NOT NULL,
    min_qty          INT           NOT NULL,
    max_qty          INT           NULL,                 -- NULL = open-ended ("50,001+")
    rate             DECIMAL(10,4) NOT NULL,             -- BDT per message, before VAT
    package_id       INT           NOT NULL,             -- package in the service's own database
    conditions_apply TINYINT(1)    NOT NULL DEFAULT 0,
    INDEX idx_sps_service_order (service, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS service_pricing_audit (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    service     VARCHAR(20)  NOT NULL,
    before_json LONGTEXT     NULL,
    after_json  LONGTEXT     NOT NULL,
    changed_by  VARCHAR(255) NULL,
    changed_at  DATETIME     NOT NULL,
    INDEX idx_spa_service_time (service, changed_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### Seed data

Inserted by the initializer only when a service has no `service_pricing` row, so it never overwrites an admin's changes. It reproduces today's live prices.

| Service | Order | Name (en / bn) | Range | Rate | Package | Badge |
|---|---|---|---|---|---|---|
| vbs | 1 | Basic / বেসিক | 1 – 20,000 | 0.40 | 9135 | no |
| vbs | 2 | Standard / স্ট্যান্ডার্ড | 20,001 – 50,000 | 0.40 | 9136 | no |
| vbs | 3 | Corporate / কর্পোরেট | 50,001+ | 0.40 | 9137 | no |
| sms | 1 | Basic / বেসিক | 1 – 20,000 | 0.32 | 9138 | no |
| sms | 2 | Standard / স্ট্যান্ডার্ড | 20,001 – 50,000 | 0.30 | 9139 | no |
| sms | 3 | Corporate / কর্পোরেট | 50,001 – 100,000 | 0.28 | 9140 | no |
| sms | 4 | Premium / প্রিমিয়াম | 100,001 – 500,000 | 0.14 | 9141 | yes |

| Service | min_total | max_total | max_quantity |
|---|---|---|---|
| vbs | 10 | 500000 | NULL |
| sms | 10 | NULL | 500000 |

## Price rule (shared by portal and gateway)

Both sides must produce the same integers, or the gateway will reject honest purchases.

```
slab   = the slab with min_qty <= qty <= max_qty (max_qty NULL = no upper bound)
price  = ceil(qty × rate)            exact decimal math, rate has at most 4 decimals
vat    = ceil(price × 15 / 100)
total  = price + vat
valid  = slab exists, qty <= max_quantity (if set), min_total <= total <= max_total (if set)
```

- Java: `BigDecimal` with `RoundingMode.CEILING`.
- TypeScript: keep the rate as an integer number of 1/10000 taka, `rateUnits = Math.round(rate * 10000)`. Then `price = Math.ceil((qty * rateUnits) / 10000)` and `vat = Math.ceil((price * 15) / 100)`. Both products are exact integers for any realistic quantity, so the ceiling no longer picks up float error.
- This fixes the ৳1 overcharge described above.
- A quantity above the last slab is no longer silently priced at the last slab. It is either covered by an open-ended last slab or rejected.

## Validation on save (TelcoREST)

A save replaces one service's whole slab list and limits in a single transaction. It is rejected with a clear message if:

- the service is not `vbs` or `sms`, or the caller is not an admin
- there are no slabs
- any name is blank, or longer than 100 characters
- the first slab does not start at 1
- any slab's `max_qty` is less than its `min_qty`
- slabs are not contiguous: each `min_qty` must equal the previous `max_qty + 1`
- any slab other than the last has an open-ended `max_qty`
- any rate is not greater than 0, or has more than 4 decimal places, or is above 100
- any `package_id` is not a positive integer
- `min_total` is negative, or `max_total` is set and below `min_total`
- `max_quantity` is set and is below the last slab's `min_qty`

Slabs are ordered by `sort_order` as sent, and must be contiguous in that order. The save writes an audit row with the previous and new lists as JSON and the admin's username.

## Backend endpoints (TelcoREST)

Following the `NidCredentialController` pattern: POST endpoints, admin checked with `JwtRoleReader` against `nid.credential.admin-roles`-style configuration (`service-pricing.admin-roles`, default `ROLE_ADMIN,ROLE_SMSADMIN`).

| Endpoint | Auth | Body | Returns |
|---|---|---|---|
| `POST /service-pricing/get` | public | none | `{ vbs: { limits, slabs, updatedAt }, sms: {...} }` |
| `POST /admin/service-pricing/details` | admin | none | the same, plus `updatedBy` |
| `POST /admin/service-pricing/update` | admin | `{ service, limits, slabs[] }` | the same shape as `details`, freshly read |

- `/FREESWITCHREST/service-pricing/get` is added to TelcoGateway's `PublicEndpointRegistry`. The update endpoint is not, so the gateway authenticates it first.
- The public response contains prices only. No audit data, no usernames.
- The admin read is `/details`, not `/get`, because TelcoREST's `DatabaseContextResolver` matches its public list by path suffix. `/service-pricing/get` is on that public list; both admin paths are on its "always main database" list.
- Every query names the `tenant_master` schema (`service-pricing.schema`), because TelcoREST's DataSource routes per tenant.

## Payment gateway check (PaymentGateWay)

- New `SlabPricingValidator` reads `tenant_master.service_pricing` and `service_pricing_slab` with `JdbcTemplate`. The schema name comes from `service-pricing.schema` (default `tenant_master`), checked against the same safe-identifier pattern `RevenueReportService` uses. `payment_db` and `tenant_master` are on the same MySQL server, and the gateway already reads `tenant_master` this way.
- In `UnifiedPurchaseController.unifiedPurchase`, for `storeType` `vbs` and `sms`, before anything is published to Kafka or SSLCommerz:
  - quantity must be present and at least 1
  - recompute slab, price, VAT and total with the rule above
  - `idPackage` must equal the slab's `package_id`
  - submitted `price`, `vat` and `total` must equal the recomputed values
  - limits must hold
- The same check also runs at the start of `SslCommerzService.initiatePayment`, so the direct `/api/payment/ssl/vbs/initiate` and `/ssl/sms/initiate` routes, which skip the unified controller, are covered too. bKash only serves WiFi.
- On mismatch: HTTP 400, `status: FAILED`, `errorCode: PRICE_CHANGED`, message "Prices have changed. Please refresh the pricing page and try again." Logged with expected and submitted values.
- If the pricing tables cannot be read: HTTP 503, `errorCode: PRICING_UNAVAILABLE`. The purchase is refused rather than accepted unchecked.
- The existing PBX and Contact Center checks are unchanged.

## Portal changes (this repo)

### API client

`src/lib/api-client/servicePricing.ts` with `getServicePricing()` (public, `API_BASE_URL`) and `updateServicePricing(service, payload, authToken)`. Endpoints added to `API_ENDPOINTS.servicePricing` in `src/config/api.ts`.

### Shared pricing helper

`src/lib/servicePricing.ts` holds the slab type, `findSlab(slabs, qty)` and `quote(pricing, qty)` returning `{ slab, price, vat, total, underMin, overMax, overQty }`. The pricing page and the checkout both use it, so there is one copy of the price rule.

### Admin page

- New route `src/app/[locale]/admin/pricing/page.tsx`, titled "Service Pricing".
- Sidebar entry and `ADMIN_MENU_CATALOG` entry `/admin/pricing` in the Management section, so per-user menu permissions cover it.
- One card per service. Each card shows the limits (minimum total, maximum total, maximum quantity) and an editable slab table with columns: order handle, English name, Bangla name, from, to (blank = open-ended), rate per message, "Conditions applicable" checkbox, remove.
- The package is not shown or edited. Existing slabs keep theirs; a new slab copies the package of the slab above it; the first slab of an empty service gets the basic package (VBS 9135, SMS 9138).
- "Add slab" appends a slab whose `from` is the previous `to + 1`. Moving or removing a slab does not renumber ranges automatically; the admin fixes them and the inline check points at the problem.
- The same validation rules run in the browser before saving, so most mistakes show next to the field. The server's message is shown if it still refuses.
- A preview line under each table shows what a few sample quantities cost, using the shared helper.
- "Save" per service, disabled when nothing changed or the user has read-only access (`useCanEdit`). "Last updated by X at Y" under each card.

### Public pages

- Pricing page: fetch pricing once on mount. Both slab tables, the slab label, the calculator, the badge (now `slab.conditionsApply` instead of `packageId === 'premium'`), the minimum and maximum messages, and Buy Now use the fetched data.
- While loading, the tables show a skeleton and Buy Now is disabled. If the fetch fails, the section shows "Prices could not be loaded" with a Retry button, and Buy Now stays disabled. Showing built-in fallback prices is not done, because after an admin change they would be wrong and the gateway would reject the purchase.
- The limit messages ("Minimum purchase amount is ৳10", "Maximum 500,000 messages") are built from the fetched limits.
- Checkout: the selected package carries `packageIdInt` from the slab. `getPackageIdInt` keeps its PBX and Contact Center entries, and uses the slab's package for VBS and SMS. Price and VAT come from the shared helper.
- Homepage: the VBS and SMS "Starting from" prices show the lowest rate from the fetched pricing. If the fetch fails, the price line is hidden for those two cards.
- Remove the stale SMS rates in the homepage plan list, the dashboard mock list and `getPackageById.ts` where they are unused. Where they are used, point them at fetched pricing.

## Rollout order

1. TelcoREST (tables, seed, endpoints) and TelcoGateway (public endpoint). Prices are now readable; nothing uses them yet.
2. Portal (admin page, public pages read from the backend, rounding fix).
3. PaymentGateWay check.

Step 3 must not ship before step 2: the old portal still has the rounding bug, so the gateway would reject honest purchases like 100 SMS at ৳0.28.

## Testing

- TelcoREST: unit tests for the save validator (each rule above, plus a valid list) and for the seeder being a no-op when rows exist.
- PaymentGateWay: unit tests for `SlabPricingValidator`: correct quote passes; wrong price, wrong VAT, wrong total, wrong package, quantity outside every slab, under minimum, over maximum all fail; `100 × 0.28` gives 28.
- Portal: run `npm run build` and lint. Check by hand in the browser: admin edits a rate, the pricing page shows it, the calculator total matches the gateway, and a tampered total is refused.

## Out of scope

- Creating new packages in the SMS or VBS databases. A new slab reuses the package of the slab above it. The purchase is recorded against that package, so its name in purchase history and invoices is the package's name, not the slab's.
- Editing VAT. It stays 15%.
- Pricing for PBX and Contact Center.
- Scheduled price changes and price history pages. The audit table records changes, but there is no page for it yet.
