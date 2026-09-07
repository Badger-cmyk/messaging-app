const express = require('express');
const pool = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// All conversation routes require a logged-in user
router.use(authenticateToken);

router.post('/', async (req, res) => {
  const { participantIds, name, isGroup } = req.body;
  const creatorId = req.userId;

  if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
    return res.status(400).json({ error: 'At least one participant is required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const convResult = await client.query(
      `INSERT INTO conversations (name, is_group, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, name, is_group, created_at`,
      [name || null, !!isGroup, creatorId]
    );

    const conversation = convResult.rows[0];

    const allParticipants = [...new Set([creatorId, ...participantIds])];

    for (const userId of allParticipants) {
      await client.query(
        `INSERT INTO conversation_participants (conversation_id, user_id)
         VALUES ($1, $2)`,
        [conversation.id, userId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({ conversation, participants: allParticipants });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create conversation' });
  } finally {
    client.release();
  }
});

module.exports = router;