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

// Helper: check if a user belongs to a conversation
async function isParticipant(conversationId, userId) {
  const result = await pool.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  return result.rows.length > 0;
}

// Get message history for a conversation
router.get('/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  const userId = req.userId;

  try {
    const allowed = await isParticipant(conversationId, userId);
    if (!allowed) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const result = await pool.query(
      `SELECT messages.id, messages.content, messages.sender_id, messages.created_at,
              users.username, users.display_name
       FROM messages
       JOIN users ON users.id = messages.sender_id
       WHERE messages.conversation_id = $1
       ORDER BY messages.created_at ASC`,
      [conversationId]
    );

    res.json({ messages: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
router.post('/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  const userId = req.userId;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  try {
    const allowed = await isParticipant(conversationId, userId);
    if (!allowed) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, content, sender_id, created_at`,
      [conversationId, userId, content.trim()]
    );

    res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

module.exports = router;