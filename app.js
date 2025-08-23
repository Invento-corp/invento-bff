const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { v4: uuid } = require('uuid');
const db = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'express-dynamodb-backend', ts: new Date().toISOString() });
});

// List items
app.get('/items', async (_req, res) => {
  try {
    const items = await db.listItems();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list items' });
  }
});

// Get single item
app.get('/items/:id', async (req, res) => {
  try {
    const item = await db.getItem(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get item' });
  }
});

// Create item
app.post('/items', async (req, res) => {
  try {
    const { name, quantity } = req.body || {};
    if (!name || typeof name !== 'string') return res.status(400).json({ error: 'name (string) is required' });
    const qty = Number.isFinite(quantity) ? Number(quantity) : 0;
    const item = {
      id: uuid(),
      name,
      quantity: qty,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await db.createItem(item);
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update stock (increment or set quantity)
// Body: { delta?: number, quantity?: number }
app.put('/items/:id/stock', async (req, res) => {
  try {
    const { delta, quantity } = req.body || {};
    if (delta === undefined && quantity === undefined) {
      return res.status(400).json({ error: 'Provide delta or quantity' });
    }
    const result = await db.updateStock(req.params.id, { delta, quantity });
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update stock' });
  }
});

// Delete item
app.delete('/items/:id', async (req, res) => {
  try {
    const deleted = await db.deleteItem(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

module.exports = app;