const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
// const twilio = require("twilio"); // ⛔ Disabled for development

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// Store OTPs temporarily in memory
const otpStore = {}; // { aadhar_no: { otp: 123456, expires: timestamp } }

// Twilio client setup (commented)
// const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// -------------------------------------------------------------
// 🔐 LOGIN → Check Aadhaar + Password → Generate OTP + RETURN JWT
// -------------------------------------------------------------
router.post("/login", async (req, res) => {
  const { aadhar_no, password } = req.body;
  const supabase = req.app.locals.supabase;

  if (!aadhar_no || !password) {
    return res.status(400).json({
      error: "Aadhaar number and password are required",
    });
  }

  try {
    // Query Aadhaar as string
    const { data, error } = await supabase
      .from("beneficiary")
      .select("*")
      .eq("aadhar_no", aadhar_no); // keep as string

    if (error) return res.status(500).json({ error: error.message });
    if (!data || data.length === 0)
      return res.status(400).json({ error: "Invalid Aadhaar number" });

    const user = data[0];
    if (user.password !== password)
      return res.status(400).json({ error: "Incorrect password" });

    // Generate OTP and save
    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore[aadhar_no] = { otp, expires };

    console.log("Saving OTP for:", aadhar_no, "OTP:", otpStore[aadhar_no]);
    // 🔥 DEVELOPMENT MODE — log OTP instead of sending SMS
    console.log(`${aadhar_no}: ${otp}\n`);

    // ----------------------------------------------------
    // Twilio SMS sending (DISABLED IN DEVELOPMENT)
    // ----------------------------------------------------
    /*
    // try {
    //   await client.messages.create({
    //     body: `Your OTP is ${otp}. It expires in 5 minutes.`,
    //     from: process.env.TWILIO_PHONE_NUMBER,
    //     to: "+91" + user.phone_no,
    //   });
    // } catch (smsError) {
    //   return res.status(500).json({ error: "Failed to send OTP SMS" });
    // }
    */

    // ✅ Return JWT immediately for dev
    const token = jwt.sign({ aadhar_no }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.json({ message: "OTP sent to registered mobile number", token, otpSent: true });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------------
// 🔐 VERIFY OTP + RETURN JWT
// -------------------------------------------------------------
router.post("/verify-otp", (req, res) => {
  console.log("\n📩 Received OTP verification request:");
  console.log("Body:", req.body);

  const { aadhar_no, otp } = req.body;

  if (!aadhar_no || !otp) {
    console.log("❌ Missing fields");
    return res.status(400).json({ error: "Aadhaar number and OTP are required" });
  }

  const stored = otpStore[aadhar_no];
  console.log("Stored OTP object:", stored);

  if (!stored) {
    console.log("❌ No OTP stored for this Aadhaar");
    return res.status(400).json({ error: "No OTP found for this user" });
  }

  if (Date.now() > stored.expires) {
    delete otpStore[aadhar_no];
    console.log("❌ OTP expired");
    return res.status(400).json({ error: "OTP expired" });
  }

  // Compare as strings
  if (String(otp) !== String(stored.otp)) {
    console.log("❌ OTP mismatch");
    return res.status(400).json({ error: "Incorrect OTP" });
  }

  console.log("✅ OTP verified successfully");

  

  // Sign JWT for session
  const token = jwt.sign({ aadhar_no }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  // Remove OTP after use
  delete otpStore[aadhar_no];

  res.json({ message: "Login successful", token });
});

// -------------------------------------------------------------
// 🔄 FORGOT PASSWORD → Send OTP
// -------------------------------------------------------------
router.post("/forgot-password", async (req, res) => {
  const { aadhar_no } = req.body;
  const supabase = req.app.locals.supabase;

  if (!aadhar_no) {
    return res.status(400).json({ error: "Aadhaar number is required" });
  }

  try {
    // Check if user exists
    const { data, error } = await supabase
      .from("beneficiary")
      .select("aadhar_no, phone_no")
      .eq("aadhar_no", aadhar_no)
      .single();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(400).json({ error: "Aadhaar not found" });

    // Generate OTP
    const otp = generateOTP();
    const expires = Date.now() + 5 * 60 * 1000; // 5 min

    otpStore[aadhar_no] = { otp, expires };

    console.log(otp);

    // (SMS disabled for dev)
    // SEND SMS HERE IF YOU ENABLE TWILIO

    return res.json({
      message: "OTP sent for password reset",
      otpSent: true,
    });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// -------------------------------------------------------------
// 🔐 RESET PASSWORD → Verify OTP + Update Password
// -------------------------------------------------------------
router.post("/reset-password", async (req, res) => {
  const { aadhar_no, otp, new_password } = req.body;
  const supabase = req.app.locals.supabase;

  if (!aadhar_no || !otp || !new_password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const stored = otpStore[aadhar_no];
  if (!stored) {
    return res.status(400).json({ error: "No OTP found. Please request again." });
  }

  if (Date.now() > stored.expires) {
    delete otpStore[aadhar_no];
    return res.status(400).json({ error: "OTP expired" });
  }

  if (String(otp) !== String(stored.otp)) {
    return res.status(400).json({ error: "Incorrect OTP" });
  }

  // OTP is valid → update password in Supabase
  try {
    const { error } = await supabase
      .from("beneficiary")
      .update({ password: new_password })
      .eq("aadhar_no", aadhar_no);

    if (error) return res.status(500).json({ error: error.message });

    // Clear OTP
    delete otpStore[aadhar_no];

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ error: "Server error" });
  }
});

// router.post("/signup/create-account", async (req, res) => {
//   const {
//     aadhaar_no,
//     name,
//     age,
//     gender,
//     phone_no,
//     address,
//     income_yearly,
//     state,
//     district,
//     occupation,
//     password,
//     caste,
//     registration_date,
//   } = req.body;

//   // Validate required fields
//   if (!aadhaar_no || !name || !password) {
//     return res.status(400).json({
//       error: "Aadhaar number, name, and password are required.",
//     });
//   }

//   try {
//     // Insert data into Supabase table `beneficiary`
//     const supabase = req.app.locals.supabase
//       .from("beneficiary")
//       .insert([
//         {
//           aadhar_no: aadhaar_no,
//           full_name: name,
//           age: age || null,
//           gender: gender || null,
//           phone_no: phone_no || null,
//           address: address || null,
//           income_yearly: income_yearly || null,
//           state: state || null,
//           district: district || null,
//           occupation: occupation || null,
//           registration_date: registration_date || new Date(),
//           password,
//           caste: caste || null,
//         },
//       ])
//       .select()
//       .single();

//     // Supabase error
//     if (error) {
//       console.error("Supabase Insert Error:", error);
//       return res.status(400).json({ error: error.message });
//     }

//     // Success response
//     return res.status(200).json({
//       message: "Account created successfully!",
//       beneficiary: data,
//     });

//   } catch (err) {
//     console.error("Server Error:", err);
//     return res.status(500).json({
//       error: "Internal server error. Could not create account.",
//     });
//   }
// });

router.post("/signup/create-account", async (req, res) => {
  const supabase = req.app.locals.supabase; // ✅ correct

  try {
    const {
      aadhaar_no,
      name,
      age,
      gender,
      phone_no,
      address,
      income_yearly,
      state,
      district,
      occupation,
      password,
      caste,
      registration_date,
    } = req.body;

    // Required fields
    if (!aadhaar_no || !name || !password) {
      return res.status(400).json({
        error: "Aadhaar number, name, and password are required.",
      });
    }

    // ---------------------------------------------------
    // ✅ INSERT INTO BENEFICIARY TABLE (CORRECT WAY)
    // ---------------------------------------------------
    const { data, error } = await supabase
      .from("beneficiary")
      .insert([
        {
          aadhar_no: aadhaar_no,
          full_name: name,
          age: age || null,
          gender: gender || null,
          phone_no: phone_no || null,
          address: address || null,
          income_yearly: income_yearly || null,
          state: state || null,
          district: district || null,
          occupation: occupation || null,
          registration_date: registration_date || new Date(),
          password: password,
          caste: caste || null,
        },
      ])
      .select()
      .single();

    // ---------------------------------------------------
    // Supabase INSERT error
    // ---------------------------------------------------
    if (error) {
      console.error("Supabase Insert Error:", error);
      return res.status(400).json({ error: error.message });
    }

    // ---------------------------------------------------
    // If success
    // ---------------------------------------------------
    return res.status(200).json({
      message: "Account created successfully!",
      beneficiary: data,
    });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({
      error: "Internal server error.",
    });
  }
});



module.exports = router;
