import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

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
      <header className="chat-header">
        <Link to="/" className="chat-back" aria-label="Back to conversations">
          ←
        </Link>
        <div className="chat-identity">
          <h2>New conversation</h2>
        </div>
      </header>

      <div className="page-body">
        <input
          type="text"
          className="search-input"
          placeholder="Search by username or display name"
          value={query}
          onChange={handleSearch}
          aria-label="Search for someone to message"
        />

        {error && <p className="form-error">{error}</p>}

        {results.length > 0 && (
          <ul className="result-list">
            {results.map((u) => (
              <li key={u.id} className="result-item">
                <div className="avatar">
                  {(u.display_name || u.username)[0].toUpperCase()}
                </div>
                <div className="result-name">
                  <strong>{u.display_name || u.username}</strong>
                  <span>@{u.username}</span>
                </div>
                <button className="btn-secondary" onClick={() => startConversation(u.id)}>
                  Message
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}