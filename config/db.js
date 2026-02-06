const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'just3days';

let db = null;
let client = null;

const connectDB = async () => {
    if (db) return db;

    try {
        client = new MongoClient(uri, {
            monitorCommands: true,
        });

        await client.connect();
        console.log('Connected to MongoDB');

        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        console.log("MongoDB connection closed");
    }
}

module.exports = { connectDB, getDB, closeDB };
