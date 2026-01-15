import { useState } from 'react';
import { Menu, X, BarChart3, Brain, FileText, CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/sidebar.css';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: BarChart3 },
    { path: '/memorias', label: 'Memórias', icon: Brain },
    { path: '/documentos', label: 'Documentos', icon: FileText },
    { path: '/checkins', label: 'Check-ins', icon: CheckCircle },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);

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
          {menuItems.map((item) => {
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
      </nav>
    </>
  );
}
