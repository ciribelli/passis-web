import React, { useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle, Gift, PlusCircle, ShieldCheck, Sparkles, Trash2, User } from 'lucide-react';

const AdminDashboard = ({ kids, onBack, onDeposit, onDeleteTransaction, historyMap }) => {
  const [selectedKidId, setSelectedKidId] = useState(kids[0]?.id || 1);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Geral');
  const [msgStatus, setMsgStatus] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedKid = kids.find(k => k.id === parseInt(selectedKidId)) || kids[0];

  const presets = [
    { title: '📖 Leu um Livro', amount: 50, category: 'Livros & Leitura', icon: '📚' },
    { title: '🧹 Arrumou o Quarto', amount: 15, category: 'Tarefas Domésticas', icon: '🧹' },
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
      <div className="flex items-center justify-between pb-4 border-b border-amber-500/30 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="font-extrabold text-2xl text-white font-['Outfit'] flex items-center gap-2">
              Painel de Administrador
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-sans font-semibold">
                Otávio
              </span>
            </h2>
            <p className="text-xs text-slate-400">Depositar novos valores, tarefas e gerenciar o saldo dos filhos</p>
          </div>
        </div>

        <button onClick={onBack} className="kb-back-btn flex items-center gap-2">
          <ArrowLeft size={16} />
          <span>Voltar para Pastas</span>
        </button>
      </div>

      {msgStatus && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-semibold">
          <CheckCircle size={18} /> {msgStatus}
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-500/15 border border-red-500/30 text-red-300 p-3 rounded-xl mb-4 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Seleção do Filho */}
      <div className="mb-6">
        <label className="kb-label">Selecionar Filho para Depositar:</label>
        <div className="grid grid-cols-2 gap-3">
          {kids.map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setSelectedKidId(k.id)}
              className={`p-3.5 rounded-xl border flex items-center gap-3 transition font-bold ${
                parseInt(selectedKidId) === k.id
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <User size={20} />
              <div className="text-left">
                <div className="text-sm font-['Outfit']">{k.name}</div>
                <div className="text-xs text-emerald-400 font-extrabold">
                  Saldo: R$ {k.balance.toFixed(2)}
                </div>
              </div>
            </button>
          ))}
        </div>
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
            <div className="kb-preset-val">+ R$ {preset.amount.toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Formulário de Depósito */}
      <form onSubmit={handleDepositSubmit} className="bg-slate-900/60 p-5 rounded-xl border border-slate-800 mb-8">
        <h4 className="font-bold text-white mb-3 text-sm flex items-center gap-2">
          <PlusCircle size={18} className="text-emerald-400" />
          Depositar Recursos para {selectedKid?.name}
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
          className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-xl shadow-lg shadow-amber-500/20 transition text-base mt-2"
        >
          ➕ Depositar R$ {amount ? parseFloat(amount || 0).toFixed(2) : '0,00'} para {selectedKid?.name}
        </button>
      </form>

      {/* Histórico Recente para Cancelamento / Correção */}
      <div className="mt-6">
        <h4 className="font-bold text-slate-300 mb-3 text-sm">
          Últimas movimentações de {selectedKid?.name}:
        </h4>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {currentHistory.transactions && currentHistory.transactions.length > 0 ? (
            currentHistory.transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-900/40 rounded-lg border border-slate-800 text-xs">
                <div>
                  <span className={`font-bold mr-2 ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.type === 'deposit' ? '+ R$' : '- R$'} {tx.amount.toFixed(2)}
                  </span>
                  <span className="text-white font-medium">{tx.description}</span>
                  <span className="text-slate-500 ml-2">({tx.timestamp})</span>
                </div>
                <button
                  onClick={() => onDeleteTransaction(tx.id)}
                  className="p-1 text-slate-500 hover:text-red-400 transition"
                  title="Apagar transação"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-500 italic p-3">Sem histórico recente.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
