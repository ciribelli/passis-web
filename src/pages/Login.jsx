import React, { useState } from 'react';
import axios from 'axios';
import { ArrowLeft, Delete } from 'lucide-react';
import '../styles/login.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PROFILES = [
  { id: 'admin', name: 'Pai (Admin)', role: 'admin', is_admin: true, kidId: null, color: '#4F46E5', initials: 'P' },
  { id: 1, name: 'Maria Antonia', role: 'kid', is_admin: false, kidId: 1, color: '#a78bfa', initials: 'MA', avatar: '/imagens.jpg' },
  { id: 2, name: 'Jose Pedro', role: 'kid', is_admin: false, kidId: 2, color: '#06B6D4', initials: 'JP', avatar: '/imagens.jpg' }
];

export default function Login({ onLoginSuccess }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelectProfile = (profile) => {
    setSelectedProfile(profile);
    setPin('');
    setError('');
  };

  const handleBackToProfiles = () => {
    setSelectedProfile(null);
    setPin('');
    setError('');
  };

  const handleKeyPress = (num) => {
    if (loading) return;
    setError('');
    
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      
      // Valida automaticamente ao atingir 4 dígitos
      if (newPin.length === 4) {
        submitPin(newPin);
      }
    }
  };

  const handleBackspace = () => {
    if (loading) return;
    setError('');
    setPin(pin.slice(0, -1));
  };

  const handleClear = () => {
    if (loading) return;
    setError('');
    setPin('');
  };

  const submitPin = async (completedPin) => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        passcode: completedPin
      };

      if (selectedProfile.is_admin) {
        payload.is_admin = true;
      }

      // Se for admin, o backend valida em /v1/kids/1/auth com is_admin: true
      const kidId = selectedProfile.is_admin ? 1 : selectedProfile.kidId;
      const response = await axios.post(`${API_BASE_URL}/v1/kids/${kidId}/auth`, payload);

      if (response.data && response.data.success) {
        // Sucesso na autenticação
        const sessionData = {
          role: selectedProfile.role,
          kidId: selectedProfile.kidId,
          name: selectedProfile.name,
          pin: completedPin // guardado para autologin no KidsBank
        };
        
        // Salva sessão no localStorage
        localStorage.setItem('passis_auth', JSON.stringify(sessionData));
        
        // Callback para atualizar estado do App.js
        onLoginSuccess(sessionData);
      } else {
        setError(response.data?.error || 'Senha incorreta.');
        setPin(''); // Reseta o PIN em caso de erro
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Senha incorreta ou erro de conexão.');
      setPin(''); // Reseta o PIN em caso de erro
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-card">
        {!selectedProfile ? (
          // Seleção de Perfil
          <div className="profile-selection-mode">
            <div className="login-header">
              <h1>Passis</h1>
              <p>Quem está acessando o painel hoje?</p>
            </div>
            
            <div className="profiles-grid">
              {PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  className="profile-select-btn"
                  onClick={() => handleSelectProfile(profile)}
                >
                  <div
                    className="profile-avatar-circle"
                    style={{
                      backgroundColor: profile.color,
                      backgroundImage: profile.avatar ? `url(${profile.avatar})` : 'none'
                    }}
                  >
                    {!profile.avatar && profile.initials}
                  </div>
                  <div className="profile-info">
                    <span className="profile-name">{profile.name}</span>
                    <span className="profile-role">
                      {profile.role === 'admin' ? 'Administrador' : 'Filho(a)'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Digitação de PIN
          <div className="pin-entry-container">
            <div className="back-btn-container">
              <button className="btn-back-to-profiles" onClick={handleBackToProfiles}>
                <ArrowLeft size={16} />
                Voltar aos perfis
              </button>
            </div>

            <div className="selected-profile-header">
              <div
                className="selected-profile-avatar"
                style={{
                  backgroundColor: selectedProfile.color,
                  backgroundImage: selectedProfile.avatar ? `url(${selectedProfile.avatar})` : 'none'
                }}
              >
                {!selectedProfile.avatar && selectedProfile.initials}
              </div>
              <h2>{selectedProfile.name}</h2>
              <p>{selectedProfile.is_admin ? 'Digite a senha do Pai' : 'Digite o seu PIN de 4 dígitos'}</p>
            </div>

            {/* Dots */}
            <div className="pin-dots-container">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`pin-dot ${pin.length > index ? 'filled' : ''}`}
                />
              ))}
            </div>

            {/* Mensagem de Erro */}
            <div className="pin-error-text">
              {error}
              {loading && 'Verificando senha...'}
            </div>

            {/* Teclado */}
            <div className="keypad-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  className="keypad-btn"
                  onClick={() => handleKeyPress(num)}
                  disabled={loading}
                >
                  {num}
                </button>
              ))}
              <button
                className="keypad-btn action-btn"
                onClick={handleClear}
                disabled={loading}
              >
                Limpar
              </button>
              <button
                className="keypad-btn"
                onClick={() => handleKeyPress(0)}
                disabled={loading}
              >
                0
              </button>
              <button
                className="keypad-btn action-btn delete-btn"
                onClick={handleBackspace}
                disabled={loading}
                aria-label="Apagar dígito"
              >
                <Delete size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
