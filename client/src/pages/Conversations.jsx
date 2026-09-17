import { useAuth } from '../context/useAuth';

export default function Conversations() {
  const { user, logout } = useAuth();
  return (
    <div>
      <h1>Welcome, {user?.display_name}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}