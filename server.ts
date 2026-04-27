import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"]
    }
  });

  const PORT = 3000;
  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const DB_NAME = 'crisis_response';

  app.use(cors());
  app.use(express.json());

  // Logging middleware for API
  app.use('/api', (req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });

  let collection: any;

  // In-memory fallback
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

  // Default to memory collection until MongoDB connects
  collection = memoryCollection;

  // Attempt MongoDB connection asynchronously
  MongoClient.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
    .then(client => {
      const db = client.db(DB_NAME);
      collection = db.collection('alerts');
      console.log('Successfully connected to MongoDB');
    })
    .catch(error => {
      console.error('MongoDB connection error. Staying with in-memory storage.', error.message);
    });

  // API Routes
  app.get('/api/alerts', async (req, res) => {
    try {
      const alerts = await collection.find().sort({ timestamp: -1 }).toArray();
      res.json(alerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.post('/api/alerts', async (req, res) => {
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

      io.emit('alert:created', insertedAlert);
      res.status(201).json(insertedAlert);
    } catch (error) {
      console.error('Create alert error:', error);
      res.status(500).json({ error: 'Failed to create alert' });
    }
  });

  app.patch('/api/alerts/:id', async (req, res) => {
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
        io.emit('alert:updated', updatedAlert);
        res.json(updatedAlert);
      } else {
        res.status(404).json({ error: 'Alert not found' });
      }
    } catch (error) {
      console.error('Update alert error:', error);
      res.status(500).json({ error: 'Failed to update alert' });
    }
  });

  // API 404 Handler - MUST be before Vite/Static fallback
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route ${req.method} ${req.url} not found` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
