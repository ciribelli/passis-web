import React, { useState } from 'react';
import { Delete, Lock, X } from 'lucide-react';

const PinKeypadModal = ({ isOpen, onClose, onSubmit, title = "Digite sua Senha", subtitle = "Informe seu PIN de 4 dígitos" }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg('');
      if (nextPin.length === 4) {
        // Envia automaticamente ao atingir 4 dígitos
        setTimeout(() => {
          handleSubmit(nextPin);
        }, 150);
      }
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleSubmit = (pinToSubmit = pin) => {
    if (pinToSubmit.length !== 4) {
      setErrorMsg('O PIN deve conter 4 dígitos.');
      return;
    }
    onSubmit(pinToSubmit, (error) => {
      if (error) {
        setErrorMsg(error);
        setPin('');
      } else {
        setPin('');
        setErrorMsg('');
      }
    });
  };

  return (
    <div className="kb-modal-overlay">
      <div className="kb-pin-modal">
        <div className="flex justify-between items-center mb-2">
          <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center">
            <Lock size={18} />
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <h3 className="font-bold text-xl text-white font-['Outfit'] mb-1">{title}</h3>
        <p className="text-sm text-slate-400 mb-4">{subtitle}</p>

        {/* Indicadores de PIN (Bolinhas) */}
        <div className="kb-pin-dots">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`kb-pin-dot ${i < pin.length ? 'filled' : ''}`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="text-red-400 text-xs font-semibold mb-3 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
            {errorMsg}
          </div>
        )}

        {/* Teclado Numérico 3x4 */}
        <div className="kb-keypad-grid">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num)}
              className="kb-keypad-btn"
            >
              {num}
            </button>
          ))}
          <button onClick={handleClear} className="kb-keypad-btn action">
            C
          </button>
          <button onClick={() => handleKeyPress('0')} className="kb-keypad-btn">
            0
          </button>
          <button onClick={handleDelete} className="kb-keypad-btn action">
            <Delete size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinKeypadModal;
