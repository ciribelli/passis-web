import { useState } from 'react';
import { Menu, X, BarChart3, Brain, FileText, CheckCircle, PiggyBank, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';

export default function Sidebar({ session, onLogout }) {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3, adminOnly: true },
    { path: '/banco-dos-filhos', label: 'Cofre dos Filhos', icon: PiggyBank, adminOnly: false },
    { path: '/memorias', label: 'Memórias', icon: Brain, adminOnly: true },
    { path: '/documentos', label: 'Documentos', icon: FileText, adminOnly: true },
    { path: '/checkins', label: 'Check-ins', icon: CheckCircle, adminOnly: true },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

  const isAdmin = session?.role === 'admin';
  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>Menu</h2>
        </div>
        <ul className="sidebar-menu">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`menu-link ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    // Fecha o menu em telas pequenas após clicar
                    if (window.innerWidth < 768) {
                      setIsOpen(false);
                    }
                  }}
                >
                  <Icon size={20} />
                  {isOpen && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {session && (
          <div className="sidebar-footer">
            {isOpen && (
              <div className="sidebar-user-info">
                <span className="user-greeting">Olá,</span>
                <span className="user-name">{session.name}</span>
              </div>
            )}
            <button className="logout-btn" onClick={onLogout} title="Sair">
              <LogOut size={20} />
              {isOpen && <span>Sair</span>}
            </button>
          </div>
        )}
      </nav>
    </>
  );
}

