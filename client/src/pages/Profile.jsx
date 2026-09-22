import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [statusMessage, setStatusMessage] = useState(user?.status_message || '');
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture || '');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const res = await axios.put(
        `${API_URL}/auth/me`,
        {
          display_name: displayName,
          status_message: statusMessage,
          profile_picture: profilePicture,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      updateUser(res.data.user);
      setSuccess('Profile updated');
    } catch {
      setError('Failed to update profile');
    }
  };

  return (
    <div>
      <header className="chat-header">
        <Link to="/" className="chat-back" aria-label="Back to conversations">
          ←
        </Link>
        <div className="chat-identity">
          <h2>Edit profile</h2>
        </div>
      </header>

      <div className="page-body">
        <div className="form-card">
          <form onSubmit={handleSubmit} noValidate>
            {error && <p className="form-error">{error}</p>}
            {success && <p className="form-success">{success}</p>}

            <div className="field">
              <label htmlFor="displayName">Display name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="statusMessage">Status message</label>
              <input
                id="statusMessage"
                type="text"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="What's on your mind?"
              />
            </div>

            <div className="field">
              <label htmlFor="profilePicture">Profile picture URL</label>
              <input
                id="profilePicture"
                type="text"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="https://…"
              />
            </div>

            <button type="submit" className="btn-primary">
              Save changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}