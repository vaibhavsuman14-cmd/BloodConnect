const { connectDB } = require("./config/database");
const User = require("./models/User");
const Hospital = require("./models/Hospital");

// Sample users and hospitals for immediate testing
const sampleUsers = [
  {
    name: "Aarav Sharma",
    email: "aarav.sharma0@gmail.com",
    password: "user123",
    phone: "+919876543210",
    bloodType: "O+",
    location: { type: "Point", coordinates: [77.209, 28.6139] },
    address: "Connaught Place, New Delhi",
    maxDistance: 15,
    isAvailable: true,
    emergencyContact: true,
    isVerified: true,
  },
  {
    name: "Vivaan Verma",
    email: "vivaan.verma1@gmail.com",
    password: "user123",
    phone: "+919876543211",
    bloodType: "A+",
    location: { type: "Point", coordinates: [77.23, 28.63] },
    address: "Karol Bagh, New Delhi",
    maxDistance: 20,
    isAvailable: true,
    emergencyContact: false,
    isVerified: true,
  },
];

const sampleHospitals = [
  {
    name: "All India Institute of Medical Sciences (AIIMS)",
    email: "aiims@hospital.com",
    password: "hospital123",
    phone: "+911126588500",
    registrationNumber: "DLH0001",
    location: { type: "Point", coordinates: [77.209, 28.5672] },
    address: "Sri Aurobindo Marg, New Delhi",
    city: "New Delhi",
    state: "Delhi",
    pincode: "110029",
    contactPerson: {
      name: "Dr. Rajesh Kumar",
      designation: "Chief Medical Officer",
      phone: "+911126588501",
    },
    services: ["Emergency", "Surgery", "Blood Bank", "ICU", "Trauma Center"],
    isVerified: true,
  },
];

async function seedBasicData() {
  try {
    console.log("Seeding basic data...");

    // Clear existing data
    await User.deleteMany({});
    await Hospital.deleteMany({});

    // Create sample users
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
    }

    // Create sample hospitals
    for (const hospitalData of sampleHospitals) {
      const hospital = new Hospital(hospitalData);
      await hospital.save();
    }

    console.log("Basic data seeded successfully!");
    console.log("\nLogin Credentials:");
    console.log("User: aarav.sharma0@gmail.com / user123");
    console.log("Hospital: aiims@hospital.com / hospital123");
  } catch (error) {
    console.error("Error seeding basic data:", error);
  }
}

module.exports = { seedBasicData };
