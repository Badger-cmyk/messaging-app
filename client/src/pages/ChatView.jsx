import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

export default function ChatView() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const socketRef = useRef(null);

  // Load message history
  useEffect(() => {
    axios
      .get(`${API_URL}/conversations/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data.messages))
      .finally(() => setLoading(false));
  }, [id, token]);

  // Load conversation details, find the other participant, check their status
  useEffect(() => {
    axios
      .get(`${API_URL}/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const other = res.data.participants.find((p) => p.id !== user.id);
        setOtherUser(other);

        if (other) {
          return axios.get(`${API_URL}/users/${other.id}/status`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      })
      .then((statusRes) => {
        if (statusRes) setIsOnline(statusRes.data.is_online);
      })
      .catch((err) => console.error(err));
  }, [id, token, user]);

  // Socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('receive_message', (message) => {
      if (String(message.conversation_id) === String(id)) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on('user_online', ({ userId }) => {
      if (otherUser && String(userId) === String(otherUser.id)) {
        setIsOnline(true);
      }
    });

    socket.on('user_offline', ({ userId }) => {
      if (otherUser && String(userId) === String(otherUser.id)) {
        setIsOnline(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id, token, otherUser]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    socketRef.current.emit('send_message', {
      conversationId: id,
      content: content.trim(),
    });

    setContent('');
  };

  if (loading) return <div>Loading messages...</div>;

  return (
    <div>
      <h2>
        {otherUser?.display_name || otherUser?.username || 'Conversation'}{' '}
        <span style={{ color: isOnline ? 'green' : 'gray' }}>
          {isOnline ? '● Online' : '○ Offline'}
        </span>
      </h2>
      <div>
        {messages.map((msg) => (
          <div key={msg.id} style={{ textAlign: msg.sender_id === user.id ? 'right' : 'left' }}>
            <p>{msg.content}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend}>
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}