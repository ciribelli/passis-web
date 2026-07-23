import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Memorias from './pages/Memorias';
import Documentos from './pages/Documentos';
import Checkins from './pages/Checkins';
import KidsBank from './pages/KidsBank';
import Login from './pages/Login';
import './styles/layout.css';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSession = localStorage.getItem('passis_auth');
    if (savedSession) {
      try {
        setSession(JSON.parse(savedSession));
      } catch (err) {
        console.error('Erro ao decodificar sessão salva:', err);
        localStorage.removeItem('passis_auth');
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('passis_auth');
    setSession(null);
  };

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#64748b' }}>Carregando sessão...</div>;
  }

  if (!session) {
    return <Login onLoginSuccess={setSession} />;
  }

  const isAdmin = session.role === 'admin';

  return (
    <Router>
      <div className="app-container">
        <Sidebar session={session} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            {isAdmin ? (
              <>
                <Route path="/" element={<Dashboard />} />
                <Route path="/memorias" element={<Memorias />} />
                <Route path="/documentos" element={<Documentos />} />
                <Route path="/checkins" element={<Checkins />} />
                <Route path="/banco-dos-filhos" element={<KidsBank />} />
                <Route path="/kids" element={<KidsBank />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/banco-dos-filhos" element={<KidsBank />} />
                <Route path="/kids" element={<KidsBank />} />
                <Route path="*" element={<Navigate to="/banco-dos-filhos" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;