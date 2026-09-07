const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const authRoutes = require('./routes/auth');
const conversationRoutes = require('./routes/conversations')

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Server is running' });
});

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      `);
    res.json({ success: true, tables: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});