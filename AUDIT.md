# Scan2Dine audit

Scope: backend (Express, Mongoose, Socket.IO) and frontend (React, Vite) as of this branch.
Method: every flow was traced from the UI call to the route, controller and model. Backend findings
were then fixed and checked with `backend/tests/integration.js` (52 checks, all passing).

**Not verified:** nothing was exercised in a browser. Frontend changes were checked by building
(`npm run build` passes) and by reading the code, not by clicking through them.

Status: **Fixed** = changed and covered by a test or build. **Open** = still needs doing.

## Critical

| # | Finding | Status |
|---|---|---|
| C1 | `POST /public/orders` trusted `restaurant_id` and never checked that the ordered items belong to that restaurant. A customer could place orders in restaurant B using restaurant A's items, polluting B's orders. | Fixed |
| C2 | Anyone could join any restaurant's live-order room over Socket.IO by sending its id (the id is public in the menu response), receiving every order with customer details. | Fixed: sockets authenticate with the staff JWT and the room comes from the token |
| C3 | The QR code pointed at `https://scan2dine.com/menu/...`, a domain that is not yours, and used a third-party QR service. Printed codes would have been dead. | Fixed: link is built from `CLIENT_URL`, image generated locally |
| C4 | JWT fell back to the hard-coded secret `"fallback_secret"`. | Fixed: server refuses to start in production without `JWT_SECRET` |
| C5 | `backend/.env` (with the Atlas password) and `node_modules` were committed to a public repo. | Fixed: untracked, password rotated |
| C6 | Menu item edit, category edit/delete/reorder were **not saved**: the UI changed local state only and the change vanished on refresh. No `PUT`/`DELETE` routes existed. | Fixed: routes and UI wired |
| C7 | Creating a menu item from the editor read `res.data.data.menuItem`, which the API never returned, putting `undefined` in the list. | Fixed |

## High

| # | Finding | Status |
|---|---|---|
| H1 | `GET /public/orders/:id` returned the whole order, including customer phone/email and internal ids, to anyone holding an id. | Fixed: limited fields only |
| H2 | Public menu `demo` alias returned the demo restaurant **with its `password_hash`, email and phone**. | Fixed: field whitelist, alias only when `MOCK_DB=true` |
| H3 | Order status accepted any string and any jump (`pending -> completed`, or editing a finished order). `findOneAndUpdate` skipped enum validation. | Fixed: valid transitions only, enforced atomically |
| H4 | Analytics matched `restaurant_id` as a string, so aggregations **never matched** and the dashboard always showed zero. Revenue chart used hard-coded fake numbers, trend arrows (+12.5%, ...) were made up, QR scans and menu count were hard-coded `0`. | Fixed: real totals and a real 7-day series; fake trends removed. QR-scan counting does not exist and is not shown |
| H5 | Random 4-digit global order numbers collide after a few dozen orders (duplicate key = failed order). | Fixed: longer random id with retry |
| H6 | `/dashboard` had no route guard; the page loaded for signed-out visitors. | Fixed: `ProtectedRoute` |
| H7 | A single rate limit of 100 requests / 15 min on all of `/api`, while order tracking polls every 10 s, and `trust proxy` unset so every visitor behind Render shared one bucket. | Fixed: generous general limit, strict limits on login, sign-up and order placement, `trust proxy` set |
| H8 | Emails were case-sensitive (`A@x.com` and `a@x.com` were different accounts) because validated values were never applied to `req.body`. | Fixed |
| H9 | Mass assignment and unvalidated input on profile update; email change could collide and return a raw DB error. | Fixed: schema validation, uniqueness check, unknown fields dropped |
| H10 | Item and category ids from the client were not checked against the restaurant (an item could be put in another restaurant's category). | Fixed |
| H11 | Customers could order unavailable items; unknown items were silently skipped (an order with total 0 was possible); quantities could be fractional. | Fixed |
| H12 | A fixed 8% "mock" tax was added to every order regardless of the restaurant. | Fixed: uses the restaurant's `tax_rate` setting (default 0) |
| H13 | The customer menu showed invented content: "(128 Reviews)" with five stars and "Experience authentic flavors." | Fixed: shows the restaurant's own description and address |
| H14 | QR page: Download, Print, Share, size options and print templates did nothing; "with logo" showed fake "S2D" branding. | Fixed: PNG/JPG/SVG export, print, share; fake options removed |

## Medium

| # | Finding | Status |
|---|---|---|
| M1 | Raw `error.message` (database internals) returned to clients. | Fixed: generic message, details logged |
| M2 | Tokens stayed valid for 30 days even after an account was deleted or disabled. | Fixed: 7 days, and the account is checked on every request |
| M3 | Order tracking ignored `accepted` and `cancelled`: a cancelled order still said "Order Confirmed!". "Order more" link used an id no longer returned. | Fixed |
| M4 | Passwords: only length 8 was enforced (rule commented out "for testing"). | Fixed: needs a letter and a number, max 72 (bcrypt limit); cost factor raised to 12 |
| M5 | `?status[$ne]=x` query-object injection on the orders list; unbounded result size. | Fixed: enum check and pagination |
| M6 | Search box and category filter on the menu page were decorative. No delete button, no availability toggle. | Fixed |
| M7 | Missing indexes on `restaurant_id`. | Fixed |
| M8 | Errors shown with `alert()` in several screens. | Partly fixed (menu, categories, checkout now inline). Open: Add Item and Settings still use `alert()` |
| M9 | Everything is shown in `$`. A `currency` field exists in settings but nothing uses it. | Open |
| M10 | Settings model (tax, hours, currency, ordering options) has no routes and no screen. | Open |
| M11 | No password reset or email verification. | Open (needs an email service) |
| M12 | `KitchenDisplay` plays `/ping.mp3`, which does not exist. | Open |
| M13 | Image upload middleware (`multer-storage-cloudinary`) is not in `package.json` and not used by any route. Items use an emoji instead of a photo. | Open |
| M14 | Free-tier hosting with `MOCK_DB=true` loses all data on every restart. Real use needs Atlas. | Open (deployment choice) |

## Low / polish

- Cart is not saved if the customer reloads the page.
- No pagination or date filter on the All Orders screen.
- Analytics days are in UTC, not the restaurant's time zone.
- Leftover unused imports flagged by ESLint (`FeatureCard`, `Analytics` `Icon` false positives, `CustomerView` `idx`, `KitchenDisplay` `isFullscreen`).
- `usercontroller.js`, `userroute.js`, `usermodel.js`, `authmodel.js` are empty files.
- Multi-restaurant isolation was re-checked at the API level (cross-tenant reads, updates, deletes, orders, status changes, analytics and sockets). All blocked; see the tests.

## Not done yet: Phase 2, the UI redesign

The screens still use the original look (many gradients, `bg-clip-text` gradient headings, mixed
radii). A consistent design system and a visual pass over every screen is the next piece of work.
It should be done with the app open in a browser so each screen can be reviewed.

## Running the tests

```bash
cd backend
MOCK_DB=true JWT_SECRET=test PORT=5057 npm start     # terminal 1
JWT_SECRET=test npm run test:integration             # terminal 2
```
