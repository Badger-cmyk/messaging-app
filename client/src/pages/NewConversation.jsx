import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function NewConversation() {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    const value = e.target.value;
    setQuery(value);

    if (!value.trim()) {
      setResults([]);
      return;
    }

    try {
      const res = await axios.get(`${API_URL}/users/search?q=${value}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data.users);
    } catch {
      setError('Search failed');
    }
  };

  const startConversation = async (userId) => {
    try {
      const res = await axios.post(
        `${API_URL}/conversations`,
        { participantIds: [userId], isGroup: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate(`/conversations/${res.data.conversation.id}`);
    } catch {
      setError('Could not start conversation');
    }
  };

  return (
    <div>
      <h1>New Conversation</h1>
      <input
        type="text"
        placeholder="Search by username or display name..."
        value={query}
        onChange={handleSearch}
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {results.map((u) => (
          <li key={u.id}>
            {u.display_name || u.username} (@{u.username})
            <button onClick={() => startConversation(u.id)}>Start Chat</button>
          </li>
        ))}
      </ul>
    </div>
  );
}