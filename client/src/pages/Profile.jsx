import { useState } from 'react';
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
      <h1>Edit Profile</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Display Name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>
        <label>
          Status Message
          <input
            type="text"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
          />
        </label>
        <label>
          Profile Picture URL
          <input
            type="text"
            value={profilePicture}
            onChange={(e) => setProfilePicture(e.target.value)}
          />
        </label>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>{success}</p>}
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}