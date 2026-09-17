import { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function Conversations() {
  const { user, token, logout } = useAuth();
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

  if (loading) return <div>Loading conversations...</div>;

  return (
    <div>
      <header>
        <h1>Welcome, {user?.display_name}</h1>
        <button onClick={logout}>Logout</button>
      </header>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Your Conversations</h2>
      {conversations.length === 0 ? (
        <p>No conversations yet.</p>
      ) : (
        <ul>
          {conversations.map((conv) => (
            <li key={conv.id}>
    <Link to={`/conversations/${conv.id}`}>
    <strong>{conv.name || (conv.is_group ? 'Group Chat' : 'Direct Message')}</strong>
    {conv.last_message && <p>{conv.last_message.content}</p>}
  </Link>
</li>
          ))}
        </ul>
      )}
    </div>
  );
}