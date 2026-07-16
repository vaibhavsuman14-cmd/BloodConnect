const express = require("express");
const BloodRequest = require("../models/BloodRequest");
const User = require("../models/User");
const Hospital = require("../models/Hospital");
const auth = require("../middleware/auth");

const router = express.Router();

// Blood type compatibility mapping
const compatibilityMap = {
  "A+": ["A+", "A-", "O+", "O-"],
  "A-": ["A-", "O-"],
  "B+": ["B+", "B-", "O+", "O-"],
  "B-": ["B-", "O-"],
  "AB+": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "AB-": ["A-", "B-", "AB-", "O-"],
  "O+": ["O+", "O-"],
  "O-": ["O-"],
};

// Create blood request (hospitals only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.userType !== "hospital") {
      return res
        .status(403)
        .json({ message: "Only hospitals can create blood requests" });
    }

    const {
      patientName,
      patientAge,
      patientGender,
      bloodType,
      unitsNeeded,
      urgency,
      neededBy,
      description,
      isEmergency,
      contactInfo,
    } = req.body;

    const bloodRequest = new BloodRequest({
      hospital: req.user._id,
      patientName,
      patientAge,
      patientGender,
      bloodType,
      unitsNeeded,
      urgency,
      neededBy: new Date(neededBy),
      description,
      isEmergency: isEmergency || false,
      contactInfo,
    });

    await bloodRequest.save();

    // Find compatible donors
    const compatibleBloodTypes = compatibilityMap[bloodType] || [bloodType];

    // Build query for donor matching
    const donorQuery = {
      bloodType: { $in: compatibleBloodTypes },
      isAvailable: true,
    };

    // For emergency requests, include emergency contact donors
    if (isEmergency || urgency === "Critical") {
      donorQuery.emergencyContact = true;
    }

    // Find donors within range using geospatial query
    const donors = await User.aggregate([
      {
        $geoNear: {
          near: req.user.location,
          distanceField: "distance",
          maxDistance: 50000, // 50km in meters
          spherical: true,
          query: donorQuery,
        },
      },
      {
        $match: {
          $expr: {
            $lte: ["$distance", { $multiply: ["$maxDistance", 1000] }],
          },
        },
      },
      {
        $sort: { distance: 1 },
      },
      {
        $limit: 20,
      },
    ]);

    // Add matched donors to the request
    bloodRequest.matchedDonors = donors.map((donor) => ({
      donor: donor._id,
      status: "Notified",
    }));

    await bloodRequest.save();

    // Send real-time notifications to matched donors
    const io = req.app.get("io");
    donors.forEach((donor) => {
      io.to(donor._id.toString()).emit("newBloodRequest", {
        requestId: bloodRequest._id,
        hospital: req.user.name,
        bloodType,
        urgency,
        isEmergency,
        distance: Math.round(donor.distance / 1000), // Convert to km
        neededBy,
      });
    });

    res.status(201).json({
      message: "Blood request created successfully",
      bloodRequest,
      matchedDonorsCount: donors.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get blood requests for hospital
router.get("/hospital", auth, async (req, res) => {
  try {
    if (req.userType !== "hospital") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { page = 1, limit = 10, status } = req.query;

    let query = { hospital: req.user._id };
    if (status) {
      query.status = status;
    }

    const requests = await BloodRequest.find(query)
      .populate("matchedDonors.donor", "_id name phone bloodType")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await BloodRequest.countDocuments(query);

    res.json({
      requests,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get blood requests for donor
router.get("/donor", auth, async (req, res) => {
  try {
    if (req.userType !== "user") {
      return res.status(403).json({ message: "Access denied" });
    }

    const requests = await BloodRequest.find({
      "matchedDonors.donor": req.user._id,
      status: { $in: ["Active", "Partially Fulfilled"] },
    })
      .populate("hospital", "name phone address")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Respond to blood request (donors)
router.patch("/:id/respond", auth, async (req, res) => {
  try {
    console.log(req, "vaibhav");

    if (req.userType !== "user") {
      return res
        .status(403)
        .json({ message: "Only donors can respond to requests" });
    }

    const { response } = req.body; // 'Confirmed' or 'Declined'

    if (!["Confirmed", "Declined"].includes(response)) {
      return res.status(400).json({ message: "Invalid response" });
    }
    const allRequests = await BloodRequest.find();
    console.log(allRequests);
    const bloodRequest = await BloodRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        "matchedDonors.donor": req.user._id,
      },
      {
        $set: {
          "matchedDonors.$.status": response,
          "matchedDonors.$.respondedAt": new Date(),
        },
      },
      { new: true }
    ).populate("hospital", "name phone");

    if (!bloodRequest) {
      return res.status(404).json({ message: "Blood request not found" });
    }

    // Notify hospital about donor response
    const io = req.app.get("io");
    io.to(bloodRequest.hospital._id.toString()).emit("donorResponse", {
      requestId: bloodRequest._id,
      donorName: req.user.name,
      donorPhone: req.user.phone,
      response,
      bloodType: req.user.bloodType,
    });

    res.json({
      message: `Response recorded: ${response}`,
      bloodRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark donor as donated (hospitals)
router.patch("/:id/donated/:donorId", auth, async (req, res) => {
  try {
    if (req.userType !== "hospital") {
      return res
        .status(403)
        .json({ message: "Only hospitals can mark donations" });
    }

    // Debug logging
    console.log("Mark as donated request:");
    console.log("Request ID:", req.params.id);
    console.log("Donor ID:", req.params.donorId);
    console.log("Donor ID type:", typeof req.params.donorId);

    // Validate donorId
    if (
      !req.params.donorId ||
      req.params.donorId === "undefined" ||
      req.params.donorId === "null"
    ) {
      return res.status(400).json({
        message: "Valid donor ID is required",
        received: req.params.donorId,
        type: typeof req.params.donorId,
      });
    }

    const bloodRequest = await BloodRequest.findOneAndUpdate(
      {
        _id: req.params.id,
        hospital: req.user._id,
        "matchedDonors.donor": req.params.donorId,
      },
      {
        $set: {
          "matchedDonors.$.status": "Donated",
          "matchedDonors.$.donatedAt": new Date(),
        },
      },
      { new: true }
    );

    if (!bloodRequest) {
      return res
        .status(404)
        .json({ message: "Blood request or donor not found" });
    }

    // Update donor's last donation date and count
    await User.findByIdAndUpdate(req.params.donorId, {
      $set: { lastDonation: new Date() },
      $inc: { donationCount: 1 },
    });

    res.json({
      message: "Donation recorded successfully",
      bloodRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get active emergency requests (public)
router.get("/emergency", async (req, res) => {
  try {
    const emergencyRequests = await BloodRequest.find({
      $or: [{ isEmergency: true }, { urgency: "Critical" }],
      status: { $in: ["Active", "Partially Fulfilled"] },
    })
      .populate("hospital", "name phone address city")
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(emergencyRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
