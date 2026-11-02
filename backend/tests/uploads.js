// Photo-upload tests. They need a server that has Cloudinary variables set (fake values are fine,
// nothing is sent to Cloudinary):
//   CLOUDINARY_CLOUD_NAME=demo-cloud CLOUDINARY_API_KEY=123456789 CLOUDINARY_API_SECRET=test-secret \
//   MOCK_DB=true JWT_SECRET=test PORT=5058 npm start
//   CLOUDINARY_API_SECRET=test-secret CLOUDINARY_CLOUD_NAME=demo-cloud BASE=http://localhost:5058 node tests/uploads.js
const crypto = require("crypto");

const BASE = process.env.BASE || "http://localhost:5058";
const SECRET = process.env.CLOUDINARY_API_SECRET || "test-secret";
const CLOUD = process.env.CLOUDINARY_CLOUD_NAME || "demo-cloud";

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
  return { status: res.status, json: await res.json().catch(() => null) };
};
const register = async (n) => {
  const r = await call("POST", "/api/auth/register", {
    body: { restaurant_name: `Photo Place ${n}`, owner_name: "Owner Name", email: `photo${n}@example.com`, password: "Passw0rdTest" },
  });
  return { token: r.json.data.token, id: r.json.data.user.id };
};
const urlIn = (restaurantId, file = "dish.jpg") =>
  `https://res.cloudinary.com/${CLOUD}/image/upload/v1700000000/scan2dine/menu/${restaurantId}/${file}`;

(async () => {
  const stamp = Date.now();
  const A = await register(`a${stamp}`);
  const B = await register(`b${stamp}`);

  check("signature needs a login (401)", (await call("GET", "/api/menu/upload-signature")).status === 401);

  const sig = await call("GET", "/api/menu/upload-signature", { token: A.token });
  const s = sig.json?.data;
  check("signature endpoint answers with upload parameters", sig.status === 200 && s?.cloud_name === CLOUD && s.api_key && s.signature, JSON.stringify(sig.json));
  check("folder is chosen by the server and is the caller's own", s?.folder === `scan2dine/menu/${A.id}`);

  // Cloudinary's rule: sort the params, join as key=value with &, append the secret, SHA-1.
  const toSign = ["allowed_formats", "folder", "timestamp"].map((k) => `${k}=${s[k]}`).join("&");
  const expected = crypto.createHash("sha1").update(toSign + SECRET).digest("hex");
  check("signature matches an independent calculation", s?.signature === expected, `${s?.signature} vs ${expected}`);
  check("secret is never returned", !JSON.stringify(sig.json).includes(SECRET));

  const sigB = (await call("GET", "/api/menu/upload-signature", { token: B.token })).json.data;
  check("each restaurant gets its own folder", sigB.folder === `scan2dine/menu/${B.id}` && sigB.signature !== s.signature);

  // Items and image URLs
  const cat = (await call("POST", "/api/menu/categories", { token: A.token, body: { name: "Mains" } })).json.data;
  const make = (image_url, token = A.token) =>
    call("POST", "/api/menu/items", { token, body: { category_id: cat._id, name: "Photo dish", price: 5, ...(image_url !== undefined ? { image_url } : {}) } });

  check("item without a photo still works", (await make()).status === 201);
  check("item with its own Cloudinary photo is accepted", (await make(urlIn(A.id))).status === 201);
  check("arbitrary external URL is rejected (400)", (await make("https://evil.example/pixel.png")).status === 400);
  check("another restaurant's folder is rejected (400)", (await make(urlIn(B.id))).status === 400);
  check("a different Cloudinary account is rejected (400)", (await make(`https://res.cloudinary.com/someone-else/image/upload/v1/scan2dine/menu/${A.id}/x.jpg`)).status === 400);
  check("http (not https) is rejected (400)", (await make(urlIn(A.id).replace("https", "http"))).status === 400);

  const item = (await make(urlIn(A.id, "first.jpg"))).json.data;
  const upd = await call("PUT", `/api/menu/items/${item._id}`, { token: A.token, body: { image_url: urlIn(A.id, "second.jpg") } });
  check("photo can be replaced", upd.status === 200 && upd.json.data.image_url.endsWith("second.jpg"));
  check("replacing with a foreign URL is rejected", (await call("PUT", `/api/menu/items/${item._id}`, { token: A.token, body: { image_url: "https://evil.example/x.png" } })).status === 400);
  const cleared = await call("PUT", `/api/menu/items/${item._id}`, { token: A.token, body: { image_url: "" } });
  check("photo can be removed", cleared.status === 200 && !cleared.json.data.image_url);

  await call("PUT", `/api/menu/items/${item._id}`, { token: A.token, body: { image_url: urlIn(A.id, "third.jpg") } });
  const menu = (await call("GET", `/api/public/menu/${A.id}`)).json.data;
  check("customers receive the photo address", menu.items.some((i) => i.image_url && i.image_url.endsWith("third.jpg")));
  check("deleting an item with a photo succeeds even if cleanup fails", (await call("DELETE", `/api/menu/items/${item._id}`, { token: A.token })).status === 200);

  console.log(`\n${pass} passed, ${failN} failed`);
  process.exit(failN ? 1 : 0);
})().catch((e) => { console.error("TEST CRASH", e); process.exit(2); });
