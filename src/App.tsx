import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Layout/Navbar';
import ToastProvider from './components/UI/Toast';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectReport from './pages/ProjectReport';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import Mentor from './pages/Mentor';
import GitZen from './pages/GitZen';
import Login from './components/UI/Login';

function App() {
  const [user, setUser] = useState<{ id: string; username: string } | null>(
    () => {
      // Try to restore from localStorage
      const saved = localStorage.getItem('simple_user');
      return saved ? JSON.parse(saved) : null;
    }
  );

  const handleLogin = (user: { id: string; username: string }) => {
    setUser(user);
    localStorage.setItem('simple_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('simple_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AppProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar user={user} onLogout={handleLogout} />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/mentor" element={<Mentor />} />
              <Route path="/project-report/:id" element={<ProjectReport />} />
              <Route path="/gitzen/:id" element={<GitZen />} />
            </Routes>
          </main>
          <ToastProvider />
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;