const cloudinary = require("cloudinary").v2;

const settings = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () => {
  const { cloudName, apiKey, apiSecret } = settings();
  return Boolean(cloudName && apiKey && apiSecret);
};

// Every restaurant uploads into its own folder, chosen by the server (never by the client).
const folderFor = (restaurantId) => `scan2dine/menu/${restaurantId}`;

// Signed uploads: the browser sends the photo straight to Cloudinary using a signature made here,
// so the API secret never reaches the browser and big files never pass through this server.
const createUploadSignature = (restaurantId) => {
  const { cloudName, apiKey, apiSecret } = settings();
  const params = {
    timestamp: Math.round(Date.now() / 1000),
    folder: folderFor(restaurantId),
    allowed_formats: "jpg,jpeg,png,webp",
  };
  const signature = cloudinary.utils.api_sign_request(params, apiSecret);
  return { cloud_name: cloudName, api_key: apiKey, signature, ...params };
};

// An image address is accepted only if it points at this restaurant's own Cloudinary folder.
// This stops owners saving arbitrary URLs (tracking pixels, other tenants' photos, other sites).
const isTrustedImageUrl = (url, restaurantId) => {
  if (url === "" || url === undefined || url === null) return true;
  const { cloudName } = settings();
  if (!cloudName) return false;
  const prefix = `https://res.cloudinary.com/${cloudName}/image/upload/`;
  return url.startsWith(prefix) && url.includes(`/${folderFor(restaurantId)}/`);
};

// "https://res.cloudinary.com/x/image/upload/v1/scan2dine/menu/abc/pic.jpg" -> "scan2dine/menu/abc/pic"
const publicIdFromUrl = (url) => {
  const start = url.indexOf("scan2dine/menu/");
  const dot = url.lastIndexOf(".");
  if (start === -1 || dot < start) return null;
  return url.slice(start, dot);
};

// Best effort: a failed clean-up must never fail the request that triggered it.
const deleteImage = async (url) => {
  try {
    if (!url || !isConfigured()) return;
    const publicId = publicIdFromUrl(url);
    if (!publicId) return;
    const { cloudName, apiKey, apiSecret } = settings();
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (error) {
    require("./logger").warn(`Could not delete image from Cloudinary: ${error.message}`);
  }
};

module.exports = { isConfigured, createUploadSignature, isTrustedImageUrl, deleteImage, folderFor, publicIdFromUrl };
