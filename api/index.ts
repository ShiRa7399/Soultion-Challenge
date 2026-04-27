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
    const id = query._id?.toString() || query.alertId || (query.$or && (query.$or[0]._id?.toString() || query.$or[1]._id));
    const index = memoryStore.findIndex(item => 
      item._id.toString() === id || item.alertId === id
    );
    if (index !== -1) {
      Object.assign(memoryStore[index], update.$set);
      return { matchedCount: 1 };
    }
    return { matchedCount: 0 };
  },
  findOneAndUpdate: async (query: any, update: any) => {
    const id = query._id?.toString() || query.alertId || (query.$or && (query.$or[0]._id?.toString() || query.$or[1]._id));
    const index = memoryStore.findIndex(item => 
      item._id.toString() === id || item.alertId === id
    );
    if (index !== -1) {
      Object.assign(memoryStore[index], update.$set);
      return memoryStore[index];
    }
    return null;
  },
  findOne: async (query: any) => {
    const id = query._id?.toString() || query.alertId || (query.$or && (query.$or[0]._id?.toString() || query.$or[1]._id));
    return memoryStore.find(item => 
      item._id.toString() === id || item.alertId === id
    ) || null;
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
    const mappedAlerts = alerts.map((a: any) => ({
      ...a,
      alertId: a.alertId || a._id.toString()
    }));
    res.json(mappedAlerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts', details: error instanceof Error ? error.message : String(error) });
  }
});

app.post('/api/alerts', async (req, res) => {
  await clientPromise;
  try {
    const alert = {
      name: req.body.name || 'Anonymous',
      roomNumber: req.body.roomNumber || 'N/A',
      organizationId: req.body.organizationId || 'GLOBAL',
      type: req.body.type || 'Other',
      timestamp: new Date().toISOString(),
      status: req.body.status || 'Pending'
    };
    const result = await collection.insertOne(alert);
    const insertedAlert = { 
      ...alert, 
      _id: result.insertedId,
      alertId: result.insertedId.toString() 
    };
    
    await collection.updateOne(
      { _id: result.insertedId },
      { $set: { alertId: result.insertedId.toString() } }
    );

    res.status(201).json(insertedAlert);
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ error: 'Failed to create alert', details: error instanceof Error ? error.message : String(error) });
  }
});

app.patch('/api/alerts/:id', async (req, res) => {
  await clientPromise;
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const query = ObjectId.isValid(id) 
      ? { $or: [{ _id: new ObjectId(id) }, { _id: id }, { alertId: id }] }
      : { $or: [{ _id: id }, { alertId: id }] };

    await collection.updateOne(query, { $set: { status } });
    const updatedAlert = await collection.findOne(query);
    
    if (updatedAlert) {
      const mappedAlert = {
        ...updatedAlert,
        alertId: updatedAlert.alertId || updatedAlert._id.toString()
      };
      res.json(mappedAlert);
    } else {
      res.status(404).json({ error: 'Alert not found', details: `No alert found with ID ${id} in current store` });
    }
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: 'Failed to update alert', details: error instanceof Error ? error.message : String(error) });
  }
});

app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
});

export default app;
