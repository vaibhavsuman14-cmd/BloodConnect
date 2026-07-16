const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;
    
    // If local MongoDB is not available, use in-memory server
    if (mongoUri.includes('localhost')) {
      try {
        await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
        console.log('Connected to local MongoDB');
        return;
      } catch (error) {
        console.log('Local MongoDB not available, starting in-memory server...');
        
        // Start in-memory MongoDB server
        mongoServer = await MongoMemoryServer.create({
          instance: {
            dbName: 'blood_donation'
          }
        });
        
        mongoUri = mongoServer.getUri();
        console.log('In-memory MongoDB server started at:', mongoUri);
      }
    }
    
    // Connect to MongoDB (local, in-memory, or Atlas)
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('MongoDB connected successfully');
    
    // Set up indexes for geospatial queries
    const db = mongoose.connection.db;
    
    // Create geospatial indexes if they don't exist
    try {
      await db.collection('users').createIndex({ location: '2dsphere' });
      await db.collection('hospitals').createIndex({ location: '2dsphere' });
      console.log('Geospatial indexes created');
    } catch (indexError) {
      console.log('Indexes already exist or error creating:', indexError.message);
    }
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Database disconnected');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
};

module.exports = { connectDB, disconnectDB };