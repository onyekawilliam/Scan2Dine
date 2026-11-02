// API integration tests: multi-restaurant isolation, ordering rules, auth hardening, live sockets.
// Start the backend first:  MOCK_DB=true JWT_SECRET=test PORT=5057 npm start
// Then run:                 JWT_SECRET=test npm run test:integration
const BASE = process.env.BASE || "http://localhost:5057";
const { io } = require("../../frontend/node_modules/socket.io-client");

let pass = 0, failN = 0;
const check = (name, ok, extra = "") => {
  ok ? pass++ : failN++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  -> " + extra}`);
};
const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
};
const register = async (n) => {
  const r = await call("POST", "/api/auth/register", {
    body: { restaurant_name: `Test Place ${n}`, owner_name: "Owner Name", email: `Owner${n}@Example.com`, password: "Passw0rdTest" },
  });
  return { token: r.json.data.token, id: r.json.data.user.id, slug: r.json.data.user.slug, r };
};

(async () => {
  const stamp = Date.now();
  const A = await register(`a${stamp}`);
  const B = await register(`b${stamp}`);
  check("register A and B", A.token && B.token);
  check("email is stored lowercase (login with different case works)",
    (await call("POST", "/api/auth/login", { body: { email: `OWNERA${stamp}@example.COM`, password: "Passw0rdTest" } })).status === 200);
  check("duplicate email rejected (409)",
    (await call("POST", "/api/auth/register", { body: { restaurant_name: "Dup Place", owner_name: "Dup Owner", email: `ownera${stamp}@example.com`, password: "Passw0rdTest" } })).status === 409);
  check("weak password (no digit) rejected",
    (await call("POST", "/api/auth/register", { body: { restaurant_name: "Weak Place", owner_name: "Weak Owner", email: `weak${stamp}@example.com`, password: "onlyletters" } })).status === 400);

  // --- A builds a menu
  const cat = (await call("POST", "/api/menu/categories", { token: A.token, body: { name: "Mains" } })).json.data;
  const item = (await call("POST", "/api/menu/items", { token: A.token, body: { category_id: cat._id, name: "Jollof Rice", price: 12.5 } })).json.data;
  const item2 = (await call("POST", "/api/menu/items", { token: A.token, body: { category_id: cat._id, name: "Sold Out Dish", price: 9, is_available: false } })).json.data;
  check("A created category and items", cat?._id && item?._id && item2?._id);

  // --- Isolation: B tries to touch A's data
  check("B cannot list A's items", !JSON.stringify((await call("GET", "/api/menu/items", { token: B.token })).json).includes(item._id));
  check("B cannot update A's item (404)", (await call("PUT", `/api/menu/items/${item._id}`, { token: B.token, body: { price: 1 } })).status === 404);
  check("B cannot delete A's item (404)", (await call("DELETE", `/api/menu/items/${item._id}`, { token: B.token })).status === 404);
  check("B cannot update A's category (404)", (await call("PUT", `/api/menu/categories/${cat._id}`, { token: B.token, body: { name: "Hacked" } })).status === 404);
  check("B cannot delete A's category (404)", (await call("DELETE", `/api/menu/categories/${cat._id}`, { token: B.token })).status === 404);
  check("B cannot create item in A's category (400)",
    (await call("POST", "/api/menu/items", { token: B.token, body: { category_id: cat._id, name: "Injected", price: 5 } })).status === 400);
  const stillThere = (await call("GET", "/api/menu/items", { token: A.token })).json.data.items.find((i) => i._id === item._id);
  check("A's item unchanged after B's attacks", stillThere && stillThere.price === 12.5 && stillThere.name === "Jollof Rice");

  // --- Public menu leaks nothing private
  const pub = (await call("GET", `/api/public/menu/${A.slug}`)).json;
  const pubText = JSON.stringify(pub);
  check("public menu loads by slug", pub.success && pub.data.items.length === 2);
  check("public menu hides email/password_hash/phone", !/password_hash|ownera|"email"|"phone"/i.test(pubText), pubText.slice(0, 200));
  const demo = await call("GET", "/api/public/menu/demo");
  check("public 'demo' alias exposes no password hash", !JSON.stringify(demo.json).includes("password_hash"));

  // --- Ordering
  const orderBody = (rid, items) => ({ restaurant_id: rid, customer_name: "", table_number: "", items });
  const o = await call("POST", "/api/public/orders", { body: orderBody(A.id, [{ menu_item_id: item._id, quantity: 2 }]) });
  check("customer can order with blank name/table", o.status === 201, JSON.stringify(o.json));
  check("total computed from DB price (25.00, no fake 8% tax)", o.json?.data?.order?.total === 25 && o.json.data.order.tax === 0, JSON.stringify(o.json?.data?.order));
  check("order response has no customer PII / restaurant_id", !/customer_phone|customer_email|restaurant_id/.test(JSON.stringify(o.json.data.order)));
  const price = await call("POST", "/api/public/orders", { body: { ...orderBody(A.id, [{ menu_item_id: item._id, quantity: 1 }]), items: [{ menu_item_id: item._id, quantity: 1, price: 0.01 }] } });
  check("client-supplied price is ignored", price.json?.data?.order?.total === 12.5);
  check("fractional quantity rejected", (await call("POST", "/api/public/orders", { body: orderBody(A.id, [{ menu_item_id: item._id, quantity: 1.5 }]) })).status === 400);
  check("unavailable item rejected (400)", (await call("POST", "/api/public/orders", { body: orderBody(A.id, [{ menu_item_id: item2._id, quantity: 1 }]) })).status === 400);
  check("cross-restaurant order rejected (A's item under B's id)",
    (await call("POST", "/api/public/orders", { body: orderBody(B.id, [{ menu_item_id: item._id, quantity: 1 }]) })).status === 400);
  check("B's order list stays empty", (await call("GET", "/api/orders", { token: B.token })).json.data.orders.length === 0);
  check("bad ObjectId handled (404, not 500)", (await call("GET", "/api/public/orders/not-an-id")).status === 404);
  const track = (await call("GET", `/api/public/orders/${o.json.data.order._id}`)).json.data;
  check("tracking returns limited fields", track.order_number && !("customer_phone" in track) && !("restaurant_id" in track) && track.restaurant_name);
  check("tracking gives a slug for 'order more' link", track.restaurant_slug === A.slug);
  const qr = (await call("GET", "/api/qr/generate", { token: A.token })).json;
  check("QR endpoint builds a local QR image for the right menu URL", qr.success && qr.data.qr_code_data_url.startsWith("data:image/png") && qr.data.menu_url.endsWith(`/menu/${A.slug}`) && !qr.data.menu_url.includes("scan2dine.com"), JSON.stringify(qr).slice(0, 200));

  // --- Order management + transitions
  const orderId = o.json.data.order._id;
  check("B cannot change A's order status (404)", (await call("PUT", `/api/orders/${orderId}/status`, { token: B.token, body: { status: "accepted" } })).status === 404);
  check("invalid status value rejected (400)", (await call("PUT", `/api/orders/${orderId}/status`, { token: A.token, body: { status: "hacked" } })).status === 400);
  check("pending -> completed blocked (409)", (await call("PUT", `/api/orders/${orderId}/status`, { token: A.token, body: { status: "completed" } })).status === 409);
  check("pending -> accepted ok", (await call("PUT", `/api/orders/${orderId}/status`, { token: A.token, body: { status: "accepted" } })).status === 200);
  check("accepted -> preparing -> ready -> completed ok",
    (await call("PUT", `/api/orders/${orderId}/status`, { token: A.token, body: { status: "preparing" } })).status === 200 &&
    (await call("PUT", `/api/orders/${orderId}/status`, { token: A.token, body: { status: "ready" } })).status === 200 &&
    (await call("PUT", `/api/orders/${orderId}/status`, { token: A.token, body: { status: "completed" } })).status === 200);
  check("completed is final (409)", (await call("PUT", `/api/orders/${orderId}/status`, { token: A.token, body: { status: "cancelled" } })).status === 409);
  check("query-object injection rejected", (await call("GET", "/api/orders?status[$ne]=x", { token: A.token })).status !== 500);

  // --- Analytics
  const stats = (await call("GET", "/api/analytics/dashboard", { token: A.token })).json.data;
  check("analytics sees real orders (previously always 0)", stats.total_orders >= 2 && stats.total_revenue >= 37.5, JSON.stringify(stats));
  check("analytics has 7 daily points and real item count", stats.daily.length === 7 && stats.menu_items_count === 1);
  const statsB = (await call("GET", "/api/analytics/dashboard", { token: B.token })).json.data;
  check("B's analytics show nothing of A's", statsB.total_orders === 0);

  // --- Category / item CRUD works for the owner
  check("A can update own item", (await call("PUT", `/api/menu/items/${item._id}`, { token: A.token, body: { price: 15, is_available: false } })).json?.data?.price === 15);
  check("deleting a non-empty category blocked (409)", (await call("DELETE", `/api/menu/categories/${cat._id}`, { token: A.token })).status === 409);
  const cat2 = (await call("POST", "/api/menu/categories", { token: A.token, body: { name: "Drinks" } })).json.data;
  check("reorder categories", (await call("PUT", "/api/menu/categories/reorder", { token: A.token, body: { order: [cat2._id, cat._id] } })).json.data[0]._id === cat2._id);
  check("A can delete own empty category", (await call("DELETE", `/api/menu/categories/${cat2._id}`, { token: A.token })).status === 200);
  check("A can delete own item", (await call("DELETE", `/api/menu/items/${item._id}`, { token: A.token })).status === 200);

  // --- Auth hardening
  check("no token -> 401", (await call("GET", "/api/orders")).status === 401);
  check("garbage token -> 401", (await call("GET", "/api/orders", { token: "abc.def.ghi" })).status === 401);
  const jwt = require("jsonwebtoken");
  const forged = jwt.sign({ id: A.id }, "fallback_secret");
  check("token forged with the old default secret is rejected", (await call("GET", "/api/orders", { token: forged })).status === 401);
  const ghost = jwt.sign({ id: "64b000000000000000000000" }, process.env.JWT_SECRET || "fallback_secret");
  check("valid token for a non-existent account is rejected", (await call("GET", "/api/orders", { token: ghost })).status === 401);
  check("unknown API route -> JSON 404", (await call("GET", "/api/nope")).status === 404);
  check("profile: duplicate email blocked", (await call("PUT", "/api/auth/profile", { token: B.token, body: { email: `ownera${stamp}@example.com` } })).status === 409);
  check("profile: unknown fields ignored (cannot self-upgrade plan)",
    (await call("PUT", "/api/auth/profile", { token: B.token, body: { phone: "123", subscription_tier: "premium", is_active: false } })).status === 200 &&
    (await call("GET", "/api/auth/me", { token: B.token })).json.data.subscription_tier === "free");

  // --- Sockets: authenticated staff get their own orders, nobody else's
  const connect = (token) => new Promise((resolve) => {
    const s = io(BASE, { auth: token ? { token } : {}, transports: ["websocket"] });
    s.on("connect", () => { s.emit("join_restaurant", A.id); setTimeout(() => resolve(s), 300); });
  });
  const sA = await connect(A.token), sB = await connect(B.token), sAnon = await connect(null);
  const got = { A: 0, B: 0, anon: 0 };
  sA.on("new_order", () => got.A++); sB.on("new_order", () => got.B++); sAnon.on("new_order", () => got.anon++);
  const item3 = (await call("POST", "/api/menu/items", { token: A.token, body: { category_id: cat._id, name: "Socket Test", price: 3 } })).json.data;
  await call("POST", "/api/public/orders", { body: orderBody(A.id, [{ menu_item_id: item3._id, quantity: 1 }]) });
  await new Promise((r) => setTimeout(r, 600));
  check("A's staff socket receives A's new order", got.A === 1, JSON.stringify(got));
  check("B's socket does NOT receive A's order even when asking to join A's room", got.B === 0, JSON.stringify(got));
  check("anonymous socket receives nothing", got.anon === 0, JSON.stringify(got));
  [sA, sB, sAnon].forEach((s) => s.close());

  console.log(`\n${pass} passed, ${failN} failed`);
  process.exit(failN ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH", e); process.exit(2); });
