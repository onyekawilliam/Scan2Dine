const Restaurant = require("../Models/restaurantmodel");

// @route   GET /api/qr/generate
const generateQR = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.restaurant.id);
    
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const menuUrl = `https://scan2dine.com/menu/${restaurant.slug}`;
    
    // In a real scenario, use qrcode library to generate data URL and upload to S3.
    // For now, we return mock URLs as requested.
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(menuUrl)}`;

    res.json({
      success: true,
      data: {
        qr_code_url: qrCodeUrl,
        menu_url: menuUrl
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  generateQR,
};
