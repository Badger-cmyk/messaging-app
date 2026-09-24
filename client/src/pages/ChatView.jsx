import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

export default function ChatView() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API_URL}/conversations/${id}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setMessages(res.data.messages))
      .finally(() => setLoading(false));
  }, [id, token]);

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

  useEffect(() => {
    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('receive_message', (message) => {
      if (String(message.conversation_id) === String(id)) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on('user_online', ({ userId }) => {
      if (otherUser && String(userId) === String(otherUser.id)) setIsOnline(true);
    });

    socket.on('user_offline', ({ userId }) => {
      if (otherUser && String(userId) === String(otherUser.id)) setIsOnline(false);
    });

    return () => socket.disconnect();
  }, [id, token, otherUser]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    socketRef.current.emit('send_message', { conversationId: id, content: content.trim() });
    setContent('');
  };

  const name = otherUser?.display_name || otherUser?.username || 'Conversation';

  return (
    <div>
      <header className="chat-header">
        <Link to="/" className="chat-back" aria-label="Back to conversations">
          ←
        </Link>
        <div className="chat-identity">
          <h2>{name}</h2>
          <div className="status-line">
            <span className={`status-dot ${isOnline ? 'online' : ''}`} />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      {loading ? (
        <p style={{ padding: 20, color: 'var(--ink-soft)' }}>Loading messages…</p>
      ) : (
        <div className="message-scroll">
          {messages.map((msg) => {
            const mine = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`bubble-row ${mine ? 'mine' : ''}`}>
                <div className={`bubble ${mine ? 'mine' : 'theirs'}`}>{msg.content}</div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      )}

      <div className="composer">
        <form onSubmit={handleSend}>
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a message"
            aria-label="Message"
          />
          <button type="submit" className="btn-send">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}