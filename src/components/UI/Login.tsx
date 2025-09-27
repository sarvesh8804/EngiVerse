import React, { useState } from 'react';

interface LoginProps {
  onLogin: (user: { id: string; username: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    setError('');
    // In a real application, you would handle authentication here
    const id = 'user_' + Math.random().toString(36).slice(2, 10);
    onLogin({ id, username: username.trim() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <form onSubmit={handleSubmit} className="relative bg-white/70 backdrop-blur-md p-12 rounded-3xl shadow-xl border border-white/80 w-full max-w-sm transition-all duration-500 ease-in-out hover:shadow-2xl hover:scale-[1.02]">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-8 text-center">
          EngiVerse <span className="text-blue-600">Login</span>
        </h2>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-300 mb-4 bg-white/50"
        />
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full px-5 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all duration-300 bg-white/50"
        />
        {error && <div className="text-red-600 mt-4 text-sm font-medium">{error}</div>}
        <button
          type="submit"
          className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;