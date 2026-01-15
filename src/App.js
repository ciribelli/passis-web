import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Memorias from './pages/Memorias';
import Documentos from './pages/Documentos';
import Checkins from './pages/Checkins';
import './styles/layout.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/memorias" element={<Memorias />} />
            <Route path="/documentos" element={<Documentos />} />
            <Route path="/checkins" element={<Checkins />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;