import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [credentials] = useLocalStorage('credentials', { username: 'admin', password: 'admin123' });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Allow login if it matches stored credentials OR the default admin/admin123 fallback
    if (
      (username === credentials?.username && password === credentials?.password) ||
      (username === 'admin' && password === 'admin123')
    ) {
      onLogin();
    } else {
      setError('Username atau password salah.');
    }
  };

  return (
    <div className="flex flex-col justify-center items-center py-12 px-4 h-full">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 space-y-6 border border-gray-100">
        <div className="flex justify-center">
            <img src="https://iili.io/KDFk4fI.png" alt="Logo" className="h-20 w-20" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Login Admin</h1>
          <p className="text-gray-500 mt-2">Silakan login untuk mengakses menu ini</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary"
              placeholder="admin123"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
