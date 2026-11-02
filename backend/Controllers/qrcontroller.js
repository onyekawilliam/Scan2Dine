const QRCode = require("qrcode");
const Restaurant = require("../Models/restaurantmodel");
const { fail, serverError, notFound } = require("../utils/http");

// The public address of the customer-facing site: the first CLIENT_URL entry, else the caller's origin.
const clientBaseUrl = (req) => {
  const configured = (process.env.CLIENT_URL || "").split(",")[0].trim();
  return (configured || req.get("origin") || "").replace(/\/+$/, "");
};

// @route   GET /api/qr/generate
const generateQR = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.id).select("slug");
    if (!restaurant) return notFound(res, "Restaurant");

    const base = clientBaseUrl(req);
    if (!base) {
      return fail(res, 500, "NOT_CONFIGURED", "The site address is not configured. Set CLIENT_URL on the server.");
    }

    // Generated locally: no third-party service sees your menu links, and it works offline.
    const menuUrl = `${base}/menu/${restaurant.slug}`;
    const dataUrl = await QRCode.toDataURL(menuUrl, { width: 600, margin: 2, errorCorrectionLevel: "M" });

    res.json({
      success: true,
      data: { menu_url: menuUrl, qr_code_url: dataUrl, qr_code_data_url: dataUrl },
    });
  } catch (error) {
    serverError(res, error);
  }
};

module.exports = { generateQR };
