const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);

// Search users by username or display name (excluding yourself)
router.get('/search', async (req, res) => {
  const { q } = req.query;
  const userId = req.userId;

  if (!q || q.trim().length === 0) {
    return res.json({ users: [] });
  }

  try {
    const result = await pool.query(
      `SELECT id, username, display_name FROM users
       WHERE (username ILIKE $1 OR display_name ILIKE $1) AND id != $2
       LIMIT 10`,
      [`%${q}%`, userId]
    );
    res.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;