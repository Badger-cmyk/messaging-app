const jwt = require('jsonwebtoken');
const pool = require('./db');

module.exports = (io) => {
  // Authenticate every socket connection using the same JWT used for REST
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Invalid token'));
      socket.userId = decoded.userId;
      next();
    });
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected`);

    // Mark user online and join a room per conversation they belong to
    await pool.query('UPDATE users SET is_online = true WHERE id = $1', [socket.userId]);

    const conversations = await pool.query(
      'SELECT conversation_id FROM conversation_participants WHERE user_id = $1',
      [socket.userId]
    );
    conversations.rows.forEach((row) => {
      socket.join(`conversation:${row.conversation_id}`);
    });

    socket.broadcast.emit('user_online', { userId: socket.userId });

    // Handle sending a message
    socket.on('send_message', async ({ conversationId, content }) => {
      console.log('Received send_message event:', conversationId, content);
      try {
        const participantCheck = await pool.query(
          'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
          [conversationId, socket.userId]
        );
        if (participantCheck.rows.length === 0) {
          console.log('User is not a participant, skipping');
          return;
        }

        const result = await pool.query(
          `INSERT INTO messages (conversation_id, sender_id, content)
           VALUES ($1, $2, $3)
           RETURNING id, content, sender_id, created_at`,
          [conversationId, socket.userId, content.trim()]
        );

        io.to(`conversation:${conversationId}`).emit('receive_message', result.rows[0]);
      } catch (err) {
        console.error(err);
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User ${socket.userId} disconnected`);
      await pool.query(
        'UPDATE users SET is_online = false, last_seen = now() WHERE id = $1',
        [socket.userId]
      );
      socket.broadcast.emit('user_offline', { userId: socket.userId });
    });
  });
};