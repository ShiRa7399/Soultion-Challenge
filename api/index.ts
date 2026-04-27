import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = 'crisis_response';

let collection: any;
const memoryStore: any[] = [];

const memoryCollection = {
  find: () => ({
    sort: () => ({
      toArray: async () => [...memoryStore].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    })
  }),
  insertOne: async (doc: any) => {
    const _id = new ObjectId();
    const newDoc = { ...doc, _id, alertId: _id.toString() };
    memoryStore.push(newDoc);
    return { insertedId: _id };
  },
  updateOne: async (query: any, update: any) => {
    const index = memoryStore.findIndex(item => item._id.toString() === query._id.toString());
    if (index !== -1) {
      Object.assign(memoryStore[index], update.$set);
      return { matchedCount: 1 };
    }
    return { matchedCount: 0 };
  },
  findOneAndUpdate: async (query: any, update: any) => {
    const index = memoryStore.findIndex(item => item._id.toString() === query._id.toString());
    if (index !== -1) {
      Object.assign(memoryStore[index], update.$set);
      return memoryStore[index];
    }
    return null;
  }
};

collection = memoryCollection;

// For Vercel, we attempt connection once per cold start
const clientPromise = MongoClient.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
  .then(client => {
    const db = client.db(DB_NAME);
    collection = db.collection('alerts');
    console.log('Successfully connected to MongoDB');
    return client;
  })
  .catch(error => {
    console.error('MongoDB connection error. Staying with in-memory storage.', error.message);
    return null;
  });

app.get('/api/alerts', async (req, res) => {
  await clientPromise;
  try {
    const alerts = await collection.find().sort({ timestamp: -1 }).toArray();
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

app.post('/api/alerts', async (req, res) => {
  await clientPromise;
  try {
    const alert = {
      ...req.body,
      timestamp: new Date().toISOString(),
      status: req.body.status || 'Pending'
    };
    const result = await collection.insertOne(alert);
    const insertedAlert = { ...alert, alertId: result.insertedId.toString(), _id: result.insertedId };
    
    await collection.updateOne(
      { _id: result.insertedId },
      { $set: { alertId: result.insertedId.toString() } }
    );

    res.status(201).json(insertedAlert);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

app.patch('/api/alerts/:id', async (req, res) => {
  await clientPromise;
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const updatedAlert = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status } }
    );
    
    if (updatedAlert) {
      res.json(updatedAlert);
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update alert' });
  }
});

export default app;
