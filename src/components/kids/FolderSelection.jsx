import React from 'react';
import { ArrowRight, ShieldCheck, Sparkles, Wallet } from 'lucide-react';

const FolderSelection = ({ kids, onSelectKid, onOpenAdmin }) => {
  return (
    <div>
      {/* Sub-header instrução */}
      <div className="text-center max-w-lg mx-auto mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
          <Sparkles size={14} /> Selecione sua Pasta Personalizada
        </div>
        <h2 className="text-2xl font-extrabold text-white font-['Outfit']">
          Quem está acessando o Cofre hoje?
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Toque na sua pasta e digite sua senha de 4 dígitos para ver seu dinheiro e fazer saques.
        </p>
      </div>

      {/* Grid de Pastas */}
      <div className="kb-folders-grid">
        {kids.map((kid) => {
          const isMaria = kid.name.toLowerCase().includes('maria');
          const themeClass = isMaria ? 'maria' : 'jose';
          const avatarCropClass = isMaria ? 'maria-crop' : 'jose-crop';

          return (
            <div
              key={kid.id}
              onClick={() => onSelectKid(kid)}
              className={`kb-folder-card ${themeClass}`}
            >
              {/* Moldura de Avatar */}
              <div className="kb-avatar-wrapper">
                <div className={`kb-avatar-img ${avatarCropClass}`} />
                <div className="kb-avatar-badge">
                  {isMaria ? '🌸' : '⚽'}
                </div>
              </div>

              {/* Informações da Pasta */}
              <div className="kb-folder-info">
                <h3 className="kb-kid-name">{kid.name}</h3>
                <span className="kb-kid-age">{kid.age} anos • Pasta Privada</span>

                {/* Prévia do Saldo Virtual */}
                <div className="kb-balance-preview">
                  <div className="kb-balance-label">Saldo Virtual</div>
                  <div className="kb-balance-val">
                    R$ {kid.balance.toFixed(2).replace('.', ',')}
                  </div>
                </div>

                <button className="kb-folder-action">
                  <span>Abrir minha pasta</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Botão de Rodapé para o Pai / Administrador */}
      <div className="mt-12 text-center">
        <button
          onClick={onOpenAdmin}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 font-bold text-sm transition"
        >
          <ShieldCheck size={18} />
          <span>Área do Pai (Depositar / Administrar)</span>
        </button>
      </div>
    </div>
  );
};

export default FolderSelection;
