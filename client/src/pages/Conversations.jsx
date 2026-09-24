import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export default function Conversations() {
  const { token, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axios
      .get(`${API_URL}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setConversations(res.data.conversations))
      .catch(() => setError('Failed to load conversations'))
      .finally(() => setLoading(false));
  }, [token]);

  const initials = (name) =>
    (name || '?')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  return (
    <div>
      <header className="app-header">
        <div className="wordmark">
          Thread<span>.</span>
        </div>
        <div className="header-actions">
          <Link to="/profile">Edit profile</Link>
          <button className="btn-text" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="page-body">
        <div className="section-heading">
          <h2>Your conversations</h2>
          <Link to="/new-conversation" className="btn-secondary">
            New chat
          </Link>
        </div>

        {error && <p className="form-error">{error}</p>}

        {loading ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading conversations…</p>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            No conversations yet. Start one to say hello.
          </div>
        ) : (
          <ul className="conversation-list">
            {conversations.map((conv) => {
              const label =
                conv.name || (conv.is_group ? 'Group chat' : 'Direct message');
              return (
                <li key={conv.id} className="conversation-item">
                  <Link to={`/conversations/${conv.id}`}>
                    <div className="avatar">{initials(label)}</div>
                    <div className="conversation-meta">
                      <strong>{label}</strong>
                      {conv.last_message && <p>{conv.last_message.content}</p>}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}