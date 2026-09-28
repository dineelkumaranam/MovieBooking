require("dotenv").config();

const express = require("express");
const path = require("path");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.warn("WARNING: Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.post("/create-order", async (req, res) => {
  try {
    const amountRupees = Number(req.body.amount);

    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
      return res.status(400).json({ error: "Invalid booking amount." });
    }

    // Razorpay expects amount in the smallest currency unit (paise for INR).
    const order = await razorpay.orders.create({
      amount: Math.round(amountRupees * 100),
      currency: "INR",
      receipt: "movie_" + Date.now()
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Unable to create payment order." });
  }
});

app.post("/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Missing payment details." });
    }

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    const verified = crypto.timingSafeEqual(
      Buffer.from(generatedSignature),
      Buffer.from(razorpay_signature)
    );

    if (!verified) {
      return res.status(400).json({
        verified: false,
        error: "Invalid payment signature."
      });
    }

    const bookingId = "MB" + Date.now();

    // In a production application, save the verified booking
    // and payment details to MySQL/MongoDB here.
    res.json({
      verified: true,
      bookingId
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      verified: false,
      error: "Payment verification failed."
    });
  }
});

app.listen(PORT, () => {
  console.log(`MovieBook running at http://localhost:${PORT}`);
});
