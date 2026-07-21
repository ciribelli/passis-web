import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FolderSelection from '../components/kids/FolderSelection';
import PinKeypadModal from '../components/kids/PinKeypadModal';
import KidDashboard from '../components/kids/KidDashboard';
import AdminDashboard from '../components/kids/AdminDashboard';
import '../styles/kidsBank.css';

// Fallback visual inicial caso a API Flask ainda esteja carregando
const DEFAULT_KIDS = [
  { id: 1, name: 'Maria Antonia', age: 14, balance: 0.0, total_earned: 0.0, total_spent: 0.0, avatar_url: '/imagens.jpg', theme_color: 'violet' },
  { id: 2, name: 'Jose Pedro', age: 11, balance: 0.0, total_earned: 0.0, total_spent: 0.0, avatar_url: '/imagens.jpg', theme_color: 'neon-blue' }
];

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const KidsBank = () => {
  const [kids, setKids] = useState(DEFAULT_KIDS);
  const [currentKid, setCurrentKid] = useState(null);
  const [viewState, setViewState] = useState('folders'); // 'folders', 'kid_dashboard', 'admin'
  
  // Modais de PIN
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [targetKidForPin, setTargetKidForPin] = useState(null);
  const [isAdminAuthPending, setIsAdminAuthPending] = useState(false);

  // Histórico por criança
  const [historyMap, setHistoryMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Carrega lista de crianças da API
  const fetchKids = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/v1/kids`);
      if (res.data && res.data.kids) {
        setKids(res.data.kids);
      }
    } catch (err) {
      console.warn('Backend Flask indisponível, usando estado local:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carrega histórico de transações de uma criança
  const fetchKidHistory = async (kidId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/v1/kids/${kidId}/history`);
      if (res.data) {
        setHistoryMap(prev => ({ ...prev, [kidId]: res.data }));
      }
    } catch (err) {
      console.warn(`Erro ao carregar histórico do filho #${kidId}:`, err);
    }
  };

  useEffect(() => {
    fetchKids();
    document.body.classList.add('kids-bank-active');
    return () => {
      document.body.classList.remove('kids-bank-active');
    };
  }, []);

  // Seleção de Pasta
  const handleSelectKid = (kid) => {
    setTargetKidForPin(kid);
    setIsAdminAuthPending(false);
    setIsPinModalOpen(true);
  };

  // Abrir Área do Admin
  const handleOpenAdminTrigger = () => {
    setTargetKidForPin(null);
    setIsAdminAuthPending(true);
    setIsPinModalOpen(true);
  };

  // Submissão do PIN
  const handlePinSubmit = async (pin, callback) => {
    try {
      if (isAdminAuthPending) {
        const res = await axios.post(`${API_BASE_URL}/v1/kids/1/auth`, {
          passcode: pin,
          is_admin: true
        });
        if (res.data && res.data.success) {
          setIsPinModalOpen(false);
          setIsAdminAuthPending(false);
          setViewState('admin');
          callback(null);
          // Carrega historico para o admin
          kids.forEach(k => fetchKidHistory(k.id));
        } else {
          callback('Senha de Administrador incorreta.');
        }
      } else if (targetKidForPin) {
        const res = await axios.post(`${API_BASE_URL}/v1/kids/${targetKidForPin.id}/auth`, {
          passcode: pin
        });
        if (res.data && res.data.success) {
          const authenticatedKid = res.data.kid || targetKidForPin;
          setCurrentKid(authenticatedKid);
          setIsPinModalOpen(false);
          setViewState('kid_dashboard');
          fetchKidHistory(authenticatedKid.id);
          callback(null);
        } else {
          callback('Senha incorreta para esta pasta.');
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Erro de autenticação ou backend indisponível.';
      callback(msg);
    }
  };

  // Realizar Saque
  const handleWithdraw = async (amount, description, onSuccess) => {
    if (!currentKid) return;
    try {
      const res = await axios.post(`${API_BASE_URL}/v1/kids/${currentKid.id}/withdraw`, {
        amount,
        description,
        passcode: currentKid.passcode || '1234'
      });
      if (res.data && res.data.kid) {
        setCurrentKid(res.data.kid);
        fetchKids();
        fetchKidHistory(currentKid.id);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao realizar o saque.');
    }
  };

  // Realizar Depósito (Admin)
  const handleDeposit = async (kidId, amount, description, category, onSuccess) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/v1/kids/${kidId}/deposit`, {
        amount,
        description,
        category
      });
      if (res.data) {
        fetchKids();
        fetchKidHistory(kidId);
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Erro ao realizar o depósito.');
    }
  };

  // Apagar Transação (Admin)
  const handleDeleteTransaction = async (txId) => {
    if (!window.confirm('Deseja realmente apagar esta transação?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/v1/kids/transactions/${txId}`);
      fetchKids();
      kids.forEach(k => fetchKidHistory(k.id));
    } catch (err) {
      alert('Erro ao apagar a transação.');
    }
  };

  return (
    <div className="kids-bank-container">
      {/* Header Fixo da Aplicação */}
      <header className="kb-header">
        <div className="kb-title-box">
          <div className="kb-title-icon">🏦</div>
          <div>
            <h1 className="kb-title">Cofre dos Filhos</h1>
            <p className="kb-subtitle">Banco Virtual da Maria Antonia & José Pedro</p>
          </div>
        </div>

        {viewState !== 'admin' && (
          <button onClick={handleOpenAdminTrigger} className="kb-admin-btn">
            👑 Área do Pai
          </button>
        )}
      </header>

      {/* Conteúdo Principal de Acordo com o Estado de Navegação */}
      {viewState === 'folders' && (
        <FolderSelection
          kids={kids}
          onSelectKid={handleSelectKid}
          onOpenAdmin={handleOpenAdminTrigger}
        />
      )}

      {viewState === 'kid_dashboard' && currentKid && (
        <KidDashboard
          kid={currentKid}
          historyData={historyMap[currentKid.id]}
          onBack={() => setViewState('folders')}
          onWithdraw={handleWithdraw}
        />
      )}

      {viewState === 'admin' && (
        <AdminDashboard
          kids={kids}
          onBack={() => setViewState('folders')}
          onDeposit={handleDeposit}
          onDeleteTransaction={handleDeleteTransaction}
          historyMap={historyMap}
        />
      )}

      {/* Modal de Teclado Numérico PIN */}
      <PinKeypadModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSubmit={handlePinSubmit}
        title={isAdminAuthPending ? "Acesso de Administrador" : `Contrasenha - ${targetKidForPin?.name}`}
        subtitle={isAdminAuthPending ? "Digite a senha de 4 dígitos do Pai (padrão: 8888)" : "Digite seu PIN de 4 dígitos para abrir sua pasta (padrão: 1234)"}
      />
    </div>
  );
};

export default KidsBank;
