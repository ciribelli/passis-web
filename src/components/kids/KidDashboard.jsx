import React, { useState } from 'react';
import { Calculator, Coins, History, LogOut, MinusCircle, PlusCircle, Sparkles, MessageSquare } from 'lucide-react';
import KidChatModal from './KidChatModal';


const KidDashboard = ({ kid, historyData, onBack, onWithdraw }) => {
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState('');


  const isMaria = kid.name.toLowerCase().includes('maria');
  const avatarCropClass = isMaria ? 'maria-crop' : 'jose-crop';

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const val = parseFloat(amount);

    if (isNaN(val) || val <= 0) {
      setErrorMsg('Digite um valor válido maior que R$ 0');
      return;
    }

    if (val > kid.balance) {
      setErrorMsg(`Saldo insuficiente! Você tem R$ ${kid.balance.toFixed(2)}`);
      return;
    }

    if (!description.trim()) {
      setErrorMsg('Por favor, informe no que você vai usar esse dinheiro.');
      return;
    }

    onWithdraw(val, description.trim(), () => {
      setIsWithdrawModalOpen(false);
      setAmount('');
      setDescription('');
      setErrorMsg('');
    });
  };

  const presetAmounts = [5, 10, 20, 50];

  return (
    <div className="kb-dashboard-card">
      {/* Cabeçalho do Dashboard */}
      <div className="kb-dash-header">
        <div className="kb-dash-profile">
          <div className={`kb-dash-avatar ${isMaria ? 'maria' : 'jose'}`}>
            <div className={`kb-avatar-img ${avatarCropClass}`} />
          </div>
          <div>
            <h2 className="font-extrabold text-2xl text-white font-['Outfit']">{kid.name}</h2>
            <p className="text-xs text-slate-400 font-semibold">{kid.age} anos • Cofre Pessoal Virtual</p>
          </div>
        </div>

        {onBack && (
          <button onClick={onBack} className="kb-back-btn flex items-center gap-2">
            <LogOut size={16} />
            <span>Trocar Pasta</span>
          </button>
        )}
      </div>

      {/* Hero Saldo Principal */}
      <div className="kb-hero-balance">
        <div className="kb-hero-title">Seu Saldo Disponível</div>
        <div className="kb-hero-amount">
          R$ {kid.balance.toFixed(2).replace('.', ',')}
        </div>

        <div className="flex justify-center gap-6 mt-3 text-xs text-slate-400">
          <div><span className="text-emerald-400 font-bold">Total Ganho:</span> R$ {kid.total_earned.toFixed(2)}</div>
          <div><span className="text-red-400 font-bold">Total Gastado:</span> R$ {kid.total_spent.toFixed(2)}</div>
        </div>

        <div className="kb-hero-actions">
          <button 
            onClick={() => setIsWithdrawModalOpen(true)}
            className="kb-btn-withdraw"
          >
            <Coins size={22} />
            <span>Sacar Dinheiro</span>
          </button>

          <button 
            onClick={() => setIsChatOpen(true)}
            className="kb-btn-chat"
          >
            <MessageSquare size={22} />
            <span>Falar com o Papai</span>
          </button>
        </div>
      </div>


      {/* Seção Educativa: Como Cheguei Nesse Dinheiro */}
      <div className="kb-story-section">
        <div className="kb-section-header">
          <Calculator className="text-purple-400" size={24} />
          <h3 className="kb-section-title">Como cheguei nesse dinheiro?</h3>
        </div>

        {/* Banner com a equação explicativa */}
        <div className="kb-equation-banner flex items-center gap-3">
          <Sparkles className="text-amber-400 shrink-0" size={20} />
          <div>
            <strong>Resumo da sua conta:</strong> Você acumulou{' '}
            <span className="text-emerald-300 font-bold">R$ {kid.total_earned.toFixed(2)}</span> em tarefas e recompensas, gastou{' '}
            <span className="text-red-300 font-bold">R$ {kid.total_spent.toFixed(2)}</span> em compras, ficando com o saldo atual de{' '}
            <span className="text-emerald-400 font-extrabold">R$ {kid.balance.toFixed(2)}</span>!
          </div>
        </div>

        {/* Lista de Transações / Linha do Tempo */}
        <div className="kb-timeline-list">
          {historyData && historyData.transactions && historyData.transactions.length > 0 ? (
            historyData.transactions.map((tx) => {
              const isDeposit = tx.type === 'deposit';

              return (
                <div key={tx.id} className={`kb-timeline-item ${isDeposit ? 'deposit' : 'withdrawal'}`}>
                  <div className="flex items-center">
                    <div className="kb-tx-icon">
                      {isDeposit ? <PlusCircle size={22} /> : <MinusCircle size={22} />}
                    </div>
                    <div className="kb-tx-details">
                      <p className="kb-tx-desc">{tx.description}</p>
                      <p className="kb-tx-meta">
                        {tx.timestamp} • <span className="text-slate-300">{tx.category}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`kb-tx-amount ${isDeposit ? 'deposit' : 'withdrawal'}`}>
                      {isDeposit ? '+' : '-'} R$ {tx.amount.toFixed(2).replace('.', ',')}
                    </div>
                    <div className="kb-tx-running">
                      Saldo: R$ {tx.balance_after.toFixed(2).replace('.', ',')}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-slate-500 bg-slate-800/40 rounded-xl border border-slate-700/50">
              <History className="mx-auto mb-2 opacity-50" size={32} />
              Nenhuma movimentação registrada ainda.
            </div>
          )}
        </div>
      </div>

      {/* Modal Form de Saque */}
      {isWithdrawModalOpen && (
        <div className="kb-modal-overlay">
          <div className="kb-modal-form">
            <h3 className="font-extrabold text-xl text-white font-['Outfit'] mb-1">
              💸 Sacar Dinheiro do Cofre
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Informe quanto quer retirar do seu saldo virtual (Saldo: R$ {kid.balance.toFixed(2)}).
            </p>

            {errorMsg && (
              <div className="text-red-400 text-xs font-semibold mb-3 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit}>
              {/* Presets rápidos */}
              <div className="kb-label">Escolha um valor rápido:</div>
              <div className="kb-preset-amounts">
                {presetAmounts.map((pVal) => (
                  <button
                    key={pVal}
                    type="button"
                    onClick={() => {
                      setAmount(pVal.toString());
                      setErrorMsg('');
                    }}
                    className={`kb-amount-chip ${parseFloat(amount) === pVal ? 'active' : ''}`}
                  >
                    R$ {pVal}
                  </button>
                ))}
              </div>

              <div className="kb-form-group">
                <label className="kb-label">Ou digite o valor (R$):</label>
                <input
                  type="number"
                  step="0.50"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Ex: 15.00"
                  className="kb-input"
                />
              </div>

              <div className="kb-form-group">
                <label className="kb-label">No que você vai gastar?</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="Ex: Comprar figurinhas, cantina da escola, etc."
                  className="kb-input"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-300 font-bold hover:bg-slate-600 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-600/30 transition"
                >
                  Confirmar Saque
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Chat Conversacional com o Pai */}
      <KidChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        kid={kid}
      />
    </div>
  );
};


export default KidDashboard;
