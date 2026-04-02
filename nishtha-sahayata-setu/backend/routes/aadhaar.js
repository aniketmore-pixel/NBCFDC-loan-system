const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const Jimp = require("jimp");
const jsQR = require("jsqr");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/verify-aadhaar", upload.single("aadhaarImage"), async (req, res) => {
  try {
    console.log("Received /verify-aadhaar request");

    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ error: "No Aadhaar image uploaded" });
    }

    console.log("File received:", req.file.originalname, "size:", req.file.size);

    // Convert image to PNG buffer
    const buffer = await sharp(req.file.buffer).png().toBuffer();
    console.log("Image converted to PNG buffer, length:", buffer.length);

    // Use Jimp to read image and get raw pixel data
    const image = await Jimp.read(buffer);
    const { data, width, height } = image.bitmap;
    console.log("Jimp image loaded:", width, "x", height);

    // Decode QR
    const code = jsQR(new Uint8ClampedArray(data), width, height);
    if (!code) {
      console.log("QR code not found in image");
      return res.status(400).json({ valid: false, error: "QR not found" });
    }

    console.log("QR code found!");
    console.log("QR data length:", code.data.length);
    console.log("QR raw data:", code.data.substring(0, 100), "..."); // log first 100 chars

    // TODO: Parse XML/JSON and verify UIDAI signature offline
    res.status(200).json({
      valid: true,
      message: "QR decoded (signature verification pending)",
      data: code.data
    });

  } catch (err) {
    console.error("Aadhaar QR Error:", err);
    res.status(500).json({ error: "QR decoding failed" });
  }
});

module.exports = router;
