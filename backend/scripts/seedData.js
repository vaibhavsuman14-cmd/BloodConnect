const mongoose = require("mongoose");
const { connectDB, disconnectDB } = require("../config/database");
const User = require("../models/User");
const Hospital = require("../models/Hospital");
require("dotenv").config();

// Delhi coordinates bounds
const DELHI_BOUNDS = {
  north: 28.88,
  south: 28.4,
  east: 77.35,
  west: 76.84,
};

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const genders = ["Male", "Female"];
const services = ["Emergency", "Surgery", "Blood Bank", "ICU", "Trauma Center"];

// Generate random coordinates within Delhi
function generateDelhiCoordinates() {
  const lat =
    Math.random() * (DELHI_BOUNDS.north - DELHI_BOUNDS.south) +
    DELHI_BOUNDS.south;
  const lng =
    Math.random() * (DELHI_BOUNDS.east - DELHI_BOUNDS.west) + DELHI_BOUNDS.west;
  return [lng, lat]; // [longitude, latitude] for GeoJSON
}

// Hospital data
const hospitalNames = [
  "All India Institute of Medical Sciences (AIIMS)",
  "Fortis Hospital Shalimar Bagh",
  "Apollo Hospital",
  "Max Super Speciality Hospital",
  "Sir Ganga Ram Hospital",
  "Medanta - The Medicity",
  "BLK Super Speciality Hospital",
  "Indraprastha Apollo Hospital",
  "Jaypee Hospital",
  "Artemis Hospital",
  "Columbia Asia Hospital",
  "Venkateshwar Hospital",
  "Holy Family Hospital",
  "Maulana Azad Medical College",
  "Ram Manohar Lohia Hospital",
  "Safdarjung Hospital",
  "Lady Hardinge Medical College",
  "Hindu Rao Hospital",
  "Lok Nayak Hospital",
  "Dr. Baba Saheb Ambedkar Hospital",
  "Deen Dayal Upadhyay Hospital",
  "Guru Teg Bahadur Hospital",
  "Rajiv Gandhi Super Speciality Hospital",
  "Dr. B.R. Ambedkar Institute",
  "Chacha Nehru Bal Chikitsalaya",
  "Institute of Human Behaviour",
  "National Institute of TB",
  "Vardhman Mahavir Medical College",
  "University College of Medical Sciences",
  "Employees State Insurance Hospital",
  "Central Government Health Scheme",
  "Railway Hospital",
  "Army Hospital Delhi Cantonment",
  "Air Force Central Medical Establishment",
  "Base Hospital Delhi Cantonment",
  "Research and Referral Hospital",
  "Military Hospital Delhi",
  "Command Hospital Delhi",
  "Delhi Heart and Lung Institute",
  "National Heart Institute",
  "Institute of Nuclear Medicine",
  "Cancer Institute and Research Centre",
  "Delhi Institute of Pharmaceutical Sciences",
  "Kalawati Saran Children Hospital",
  "Sucheta Kriplani Hospital",
  "Guru Gobind Singh Hospital",
  "Maharaja Agrasen Hospital",
  "Sant Parmanand Hospital",
  "Deep Chand Bandhu Hospital",
  "Jag Pravesh Chandra Hospital",
];

const delhiAreas = [
  "Connaught Place",
  "Karol Bagh",
  "Lajpat Nagar",
  "South Extension",
  "Saket",
  "Vasant Kunj",
  "Dwarka",
  "Janakpuri",
  "Rajouri Garden",
  "Pitampura",
  "Rohini",
  "Model Town",
  "Civil Lines",
  "Khan Market",
  "Defence Colony",
  "Greater Kailash",
  "Nehru Place",
  "Okhla",
  "Mayur Vihar",
  "Preet Vihar",
  "Laxmi Nagar",
  "Shahdara",
  "Dilshad Garden",
  "Yamuna Vihar",
  "Seelampur",
  "Shalimar Bagh",
  "Ashok Vihar",
  "Wazirabad",
  "Punjabi Bagh",
  "Tagore Garden",
  "Tilak Nagar",
  "Subhash Nagar",
  "Uttam Nagar",
  "Najafgarh",
  "Palam",
  "Mahipalpur",
  "Vasant Vihar",
  "Chanakyapuri",
  "Diplomatic Enclave",
  "RK Puram",
  "Munirka",
  "Hauz Khas",
  "Green Park",
  "Malviya Nagar",
  "Kalkaji",
  "Govindpuri",
  "Tughlakabad",
  "Badarpur",
  "Faridabad Border",
  "Noida Border",
  "Ghaziabad Border",
  "Gurgaon Border",
];

// User first names
const firstNames = [
  "Aarav",
  "Vivaan",
  "Aditya",
  "Vihaan",
  "Arjun",
  "Sai",
  "Reyansh",
  "Ayaan",
  "Krishna",
  "Ishaan",
  "Shaurya",
  "Atharv",
  "Advik",
  "Pranav",
  "Vedant",
  "Ananya",
  "Diya",
  "Priya",
  "Kavya",
  "Anika",
  "Riya",
  "Tara",
  "Siya",
  "Kiara",
  "Saanvi",
  "Aadhya",
  "Myra",
  "Pihu",
  "Angel",
  "Avni",
  "Rahul",
  "Amit",
  "Suresh",
  "Vikash",
  "Rajesh",
  "Deepak",
  "Anil",
  "Ravi",
  "Sunita",
  "Pooja",
  "Neha",
  "Preeti",
  "Kavita",
  "Sonia",
  "Rekha",
  "Meera",
];

const lastNames = [
  "Sharma",
  "Verma",
  "Gupta",
  "Singh",
  "Kumar",
  "Agarwal",
  "Bansal",
  "Jain",
  "Mittal",
  "Goel",
  "Arora",
  "Malhotra",
  "Kapoor",
  "Chopra",
  "Sethi",
  "Bhatia",
  "Saxena",
  "Tyagi",
  "Srivastava",
  "Pandey",
  "Mishra",
  "Tiwari",
  "Yadav",
  "Chauhan",
  "Joshi",
  "Nair",
  "Iyer",
  "Reddy",
  "Krishnan",
];

async function seedData() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log("Connected to database");

    // Clear existing data
    await User.deleteMany({});
    await Hospital.deleteMany({});
    console.log("Cleared existing data");

    // Create hospitals
    const hospitals = [];
    for (let i = 0; i < 50; i++) {
      const name = hospitalNames[i];
      const area = delhiAreas[Math.floor(Math.random() * delhiAreas.length)];
      const coordinates = generateDelhiCoordinates();

      const hospital = new Hospital({
        name: name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]/g, "")}@hospital.com`,
        password: "hospital123", // Will be hashed automatically
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        registrationNumber: `DLH${String(i + 1).padStart(4, "0")}`,
        location: {
          type: "Point",
          coordinates: coordinates,
        },
        address: `${Math.floor(Math.random() * 999) + 1}, ${area}, New Delhi`,
        city: "New Delhi",
        state: "Delhi",
        pincode: `1100${String(Math.floor(Math.random() * 99)).padStart(
          2,
          "0"
        )}`,
        contactPerson: {
          name: `Dr. ${
            firstNames[Math.floor(Math.random() * firstNames.length)]
          } ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
          designation: [
            "Chief Medical Officer",
            "Hospital Administrator",
            "Blood Bank In-charge",
          ][Math.floor(Math.random() * 3)],
          phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        },
        services: services.slice(0, Math.floor(Math.random() * 3) + 2),
        isVerified: true,
      });

      hospitals.push(hospital);
    }

    await Hospital.insertMany(hospitals);
    console.log("Created 50 hospitals");

    // Create users
    const users = [];
    for (let i = 0; i < 500; i++) {
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const area = delhiAreas[Math.floor(Math.random() * delhiAreas.length)];
      const coordinates = generateDelhiCoordinates();

      const user = new User({
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@gmail.com`,
        password: "user123", // Will be hashed automatically
        phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        bloodType: bloodTypes[Math.floor(Math.random() * bloodTypes.length)],
        location: {
          type: "Point",
          coordinates: coordinates,
        },
        address: `${Math.floor(Math.random() * 999) + 1}, ${area}, New Delhi`,
        maxDistance: Math.floor(Math.random() * 30) + 5, // 5-35 km
        isAvailable: Math.random() > 0.2, // 80% available
        emergencyContact: Math.random() > 0.7, // 30% emergency contacts
        donationCount: Math.floor(Math.random() * 10),
        isVerified: true,
      });

      // Set last donation date for some users
      if (user.donationCount > 0) {
        const daysAgo = Math.floor(Math.random() * 365);
        user.lastDonation = new Date(
          Date.now() - daysAgo * 24 * 60 * 60 * 1000
        );
      }

      users.push(user);
    }

    await User.insertMany(users);
    console.log("Created 500 users");

    console.log("Mock data generation completed successfully!");
    console.log("\nSample Login Credentials:");
    console.log("\n--- HOSPITALS ---");
    console.log("Email: aiims@hospital.com");
    console.log("Password: hospital123");
    console.log("\nEmail: fortishospitalshalimarbagh@hospital.com");
    console.log("Password: hospital123");

    console.log("\n--- USERS ---");
    console.log("Email: aarav.sharma0@gmail.com");
    console.log("Password: user123");
    console.log("\nEmail: vivaan.verma1@gmail.com");
    console.log("Password: user123");

    console.log(
      "\nNote: All user emails follow pattern: firstname.lastname[number]@gmail.com"
    );
    console.log(
      "All hospital emails follow pattern: hospitalname@hospital.com"
    );

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    await disconnectDB();
    process.exit(1);
  }
}

seedData();
