import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { ArrowLeft, CheckCircle, PlusCircle, ShieldCheck, Trash2, User, MessageSquare, Send } from 'lucide-react';


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const AdminDashboard = ({ kids, onBack, onDeposit, onDeleteTransaction, historyMap }) => {
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id || 1);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Geral');
  const [msgStatus, setMsgStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Estado do Chat no Admin
  const [adminMessages, setAdminMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const adminMessagesEndRef = useRef(null);

  const selectedKid = kids.find(k => k.id === parseInt(selectedKidId)) || kids[0];

  const fetchAdminMessages = useCallback(async () => {
    if (!selectedKid?.id) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/v1/kids/${selectedKid.id}/chat/messages`);
      if (res.data && res.data.messages) {
        setAdminMessages(res.data.messages);
      }
    } catch (err) {
      console.warn('Erro ao carregar mensagens admin:', err);
    }
  }, [selectedKid?.id]);

  useEffect(() => {
    fetchAdminMessages();
    const interval = setInterval(fetchAdminMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchAdminMessages]);


  useEffect(() => {
    adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [adminMessages]);

  const handleAdminReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || replySending || !selectedKid?.id) return;

    setReplySending(true);
    try {
      await axios.post(`${API_BASE_URL}/v1/kids/${selectedKid.id}/chat/reply`, {
        message: replyText.trim()
      });
      setReplyText('');
      fetchAdminMessages();
    } catch (err) {
      alert('Erro ao enviar resposta ao filho.');
    } finally {
      setReplySending(false);
    }
  };

  const presets = [
    { title: '📖 Leu um Livro', amount: 50, category: 'Livros & Leitura', icon: '📚' },
    { title: '⭐ Tarefa Especial / Nota Boa', amount: 25, category: 'Estudos', icon: '⭐' },
    { title: '🎁 Mesada / Presente', amount: 100, category: 'Mesada', icon: '🎁' }
  ];

  const handleApplyPreset = (preset) => {
    setAmount(preset.amount.toString());
    setDescription(preset.title);
    setCategory(preset.category);
    setErrorMsg('');
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);

    if (isNaN(val) || val <= 0) {
      setErrorMsg('Informe um valor de depósito maior que R$ 0');
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Informe uma descrição/motivo para o depósito.');
      return;
    }

    onDeposit(selectedKid.id, val, description.trim(), category, () => {
      setMsgStatus(`R$ ${val.toFixed(2)} depositados com sucesso para ${selectedKid.name}!`);
      setAmount('');
      setDescription('');
      setErrorMsg('');
      setTimeout(() => setMsgStatus(''), 4000);
    });
  };

  const currentHistory = historyMap[selectedKid?.id] || { transactions: [] };

  return (
    <div className="kb-admin-panel">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-amber-500/30 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="font-extrabold text-xl sm:text-2xl text-white font-['Outfit'] flex items-center gap-2 flex-wrap">
              Painel do Pai
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-sans font-semibold">
                Otávio
              </span>
            </h2>
            <p className="text-xs text-slate-400">Depositar recursos e conversar com os filhos</p>
          </div>
        </div>

        <button onClick={onBack} className="kb-back-btn flex items-center justify-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <ArrowLeft size={16} />
          <span>Voltar para Pastas</span>
        </button>
      </div>

      {msgStatus && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle size={18} className="shrink-0" /> {msgStatus}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Seleção do Filho */}
      <div className="mb-6">
        <label className="kb-label">Selecionar Filho:</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {kids.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setSelectedKidId(k.id)}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition font-bold ${
                parseInt(selectedKidId) === k.id
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <User size={22} className="shrink-0" />
              <div className="text-left">
                <div className="text-sm sm:text-base font-['Outfit']">{k.name}</div>
                <div className="text-xs text-emerald-400 font-extrabold">
                  Saldo Atual: R$ {k.balance.toFixed(2).replace('.', ',')}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Seção de Chat do Pai com o Filho Selecionado */}
      <div className="bg-slate-900/80 p-4 rounded-xl border border-purple-500/30 mb-8">
        <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
          <MessageSquare size={18} className="text-purple-400 shrink-0" />
          <span>Mensagens Diretas com {selectedKid?.name} (WhatsApp 📲)</span>
        </h4>

        <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 h-48 overflow-y-auto mb-3 space-y-2">
          {adminMessages.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-12 italic">
              Nenhuma mensagem registrada com {selectedKid?.name}.
            </div>
          ) : (
            adminMessages.map((m) => (
              <div
                key={m.id}
                className={`p-2 rounded-lg text-xs max-w-[85%] ${
                  m.sender === 'father'
                    ? 'ml-auto bg-amber-500/20 border border-amber-500/40 text-amber-200'
                    : 'mr-auto bg-purple-600/20 border border-purple-500/30 text-purple-200'
                }`}
              >
                <div className="font-bold text-[10px] opacity-75 mb-0.5">
                  {m.sender === 'father' ? '👨 Você (Papai)' : `👧/👦 ${selectedKid?.name}`}
                </div>
                <div>{m.message}</div>
                <div className="text-[9px] text-slate-400 text-right mt-1">{m.timestamp}</div>
              </div>
            ))
          )}
          <div ref={adminMessagesEndRef} />
        </div>

        <form onSubmit={handleAdminReplySubmit} className="flex gap-2">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder={`Responder a ${selectedKid?.name}...`}
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={!replyText.trim() || replySending}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition shrink-0 disabled:opacity-50"
          >
            <Send size={14} />
            <span>Enviar</span>
          </button>
        </form>
      </div>

      {/* Atalhos Rápidos de Depósito */}
      <div className="kb-label">Atalhos Rápidos de Recompensa:</div>
      <div className="kb-admin-presets">
        {presets.map((preset, idx) => (
          <div
            key={idx}
            onClick={() => handleApplyPreset(preset)}
            className="kb-preset-btn"
          >
            <div className="kb-preset-icon">{preset.icon}</div>
            <div className="kb-preset-title">{preset.title}</div>
            <div className="kb-preset-val">+ R$ {preset.amount.toFixed(2).replace('.', ',')}</div>
          </div>
        ))}
      </div>

      {/* Formulário de Depósito */}
      <form onSubmit={handleDepositSubmit} className="bg-slate-900/60 p-4 sm:p-5 rounded-xl border border-slate-800 mb-8">
        <h4 className="font-bold text-white mb-4 text-sm flex items-center gap-2">
          <PlusCircle size={18} className="text-emerald-400 shrink-0" />
          Novo Depósito para {selectedKid?.name}
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="kb-form-group">
            <label className="kb-label">Valor do Depósito (R$):</label>
            <input
              type="number"
              step="1.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 50.00"
              className="kb-input"
            />
          </div>

          <div className="kb-form-group">
            <label className="kb-label">Categoria:</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Leitura, Tarefa, Presente"
              className="kb-input"
            />
          </div>
        </div>

        <div className="kb-form-group">
          <label className="kb-label">Motivo / Descrição:</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Li o livro Harry Potter, ganhei R$ 50"
            className="kb-input"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition text-sm sm:text-base mt-2"
        >
          ➕ Depositar R$ {amount ? parseFloat(amount || 0).toFixed(2).replace('.', ',') : '0,00'} para {selectedKid?.name}
        </button>
      </form>

      {/* Histórico Recente para Cancelamento / Correção */}
      <div className="mt-6">
        <h4 className="font-bold text-slate-300 mb-3 text-sm">
          Últimas movimentações de {selectedKid?.name}:
        </h4>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {currentHistory.transactions && currentHistory.transactions.length > 0 ? (
            currentHistory.transactions.map((tx) => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-900/60 rounded-xl border border-slate-800 text-xs gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-extrabold text-sm ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'deposit' ? '+ R$' : '- R$'} {tx.amount.toFixed(2).replace('.', ',')}
                    </span>
                    <span className="text-white font-semibold truncate">{tx.description}</span>
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    {tx.timestamp} • <span className="text-slate-300">{tx.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => onDeleteTransaction(tx.id)}
                  className="self-end sm:self-center p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center gap-1 text-[11px]"
                  title="Apagar transação"
                >
                  <Trash2 size={15} />
                  <span className="sm:hidden font-semibold">Excluir</span>
                </button>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 italic p-3 text-center bg-slate-900/30 rounded-xl">
              Nenhuma movimentação recente registrada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

