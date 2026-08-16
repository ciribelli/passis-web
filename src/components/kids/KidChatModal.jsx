import React, { useState, useEffect, useRef, useCallback } from 'react';

import axios from 'axios';
import { X, Send, Sparkles, Home, Volume2, Coins, Heart, CheckCheck, RefreshCw, MessageSquare } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const QUICK_ACTIONS = [
  {
    id: 'home',
    label: '🏠 Estou em casa',
    text: 'Pai, estou em casa e preciso falar com você.',
    icon: Home,
    color: 'emerald'
  },
  {
    id: 'alexa',
    label: '🔊 Me ligue na Alexa',
    text: 'Pai, me ligue na Alexa quando puder.',
    icon: Volume2,
    color: 'sky'
  },
  {
    id: 'withdraw',
    label: '💸 Pedir saque',
    text: 'Pai, posso fazer um saque no meu cofre virtual?',
    icon: Coins,
    color: 'amber'
  },
  {
    id: 'love',
    label: '❤️ Te amo Papai',
    text: 'Oi Papai! Passando para te mandar um abraço e dizer que te amo! ❤️',
    icon: Heart,
    color: 'rose'
  }
];

const KidChatModal = ({ isOpen, onClose, kid }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const isMaria = kid?.name?.toLowerCase().includes('maria');

  const prevMsgCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = useCallback(async () => {
    if (!kid?.id) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/v1/kids/${kid.id}/chat/messages`);
      if (res.data && res.data.messages) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.warn('Erro ao carregar mensagens do chat:', err);
    }
  }, [kid?.id]);

  useEffect(() => {
    if (isOpen && kid?.id) {
      setLoading(true);
      prevMsgCountRef.current = 0;
      fetchMessages().finally(() => {
        setLoading(false);
        setTimeout(scrollToBottom, 150);
      });

      // Polling a cada 3.5s para receber respostas do Pai em tempo real
      const interval = setInterval(fetchMessages, 3500);
      return () => clearInterval(interval);
    }
  }, [isOpen, kid?.id, fetchMessages]);

  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      scrollToBottom();
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);


  const handleSendMessage = async (textToSend, actionType = 'custom') => {
    const text = textToSend || inputText;
    if (!text.trim() || sending || !kid?.id) return;

    setSending(true);

    // Adiciona mensagem otimista no estado
    const tempMsg = {
      id: Date.now(),
      kid_id: kid.id,
      sender: 'kid',
      message: text.trim(),
      action_type: actionType,
      whatsapp_status: 'sending',
      timestamp: 'Agora'
    };

    setMessages(prev => [...prev, tempMsg]);
    setInputText('');

    try {
      const res = await axios.post(`${API_BASE_URL}/v1/kids/${kid.id}/chat/send`, {
        message: text.trim(),
        action_type: actionType
      });

      if (res.data && res.data.chat_message) {
        fetchMessages();
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      // Atualiza mensagem local com erro caso falhe
      setMessages(prev =>
        prev.map(m => (m.id === tempMsg.id ? { ...m, whatsapp_status: 'failed' } : m))
      );
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="kb-modal-overlay">
      <div className="kb-chat-modal">
        {/* Header do Chat */}
        <div className="kb-chat-header">
          <div className="flex items-center gap-3">
            <div className={`kb-dash-avatar sm ${isMaria ? 'maria' : 'jose'}`}>
              <div className={`kb-avatar-img ${isMaria ? 'maria-crop' : 'jose-crop'}`} />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg font-['Outfit'] flex items-center gap-2">
                <span>Conversar com o Papai</span>
                <span className="kb-wapp-badge">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  WhatsApp Direct
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Suas mensagens chegam direto no WhatsApp do Papai 📲
              </p>
            </div>
          </div>

          <button onClick={onClose} className="kb-chat-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Chips de Ações Rápidas */}
        <div className="kb-quick-actions-bar">
          <div className="text-xs text-purple-300 font-bold mb-1.5 flex items-center gap-1">
            <Sparkles size={14} className="text-amber-400" />
            <span>Ações Rápidas em 1 Clique:</span>
          </div>
          <div className="kb-quick-chips-grid">
            {QUICK_ACTIONS.map(action => (
              <button
                key={action.id}
                onClick={() => handleSendMessage(action.text, action.id)}
                disabled={sending}
                className={`kb-quick-chip chip-${action.color}`}
              >
                <action.icon size={14} />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Corpo de Mensagens */}
        <div className="kb-chat-messages-container">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-2">
              <RefreshCw size={18} className="animate-spin text-purple-400" />
              <span>Carregando conversa...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-10 px-4 text-slate-400">
              <MessageSquare size={36} className="mx-auto mb-2 opacity-40 text-purple-400" />
              <p className="font-semibold text-slate-300 text-sm">Nenhuma mensagem ainda.</p>
              <p className="text-xs mt-1 text-slate-400">
                Use os botões de ação rápida acima ou digite uma mensagem para o Papai!
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isKid = msg.sender === 'kid';

              return (
                <div key={msg.id || index} className={`kb-chat-bubble-wrapper ${isKid ? 'kid-side' : 'father-side'}`}>
                  <div className={`kb-chat-bubble ${isKid ? (isMaria ? 'maria-bubble' : 'jose-bubble') : 'father-bubble'}`}>
                    <div className="kb-chat-sender-name">
                      {isKid ? kid.name : '👨 Papai (WhatsApp)'}
                    </div>
                    <div className="kb-chat-text">{msg.message}</div>
                    <div className="kb-chat-meta">
                      <span>{msg.timestamp || 'Agora'}</span>
                      {isKid && (
                        <span className="flex items-center gap-1 text-emerald-300">
                          {msg.whatsapp_status === 'sending' ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <CheckCheck size={13} />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Form de Envio de Texto */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="kb-chat-input-form"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Digite sua mensagem para o Papai..."
            className="kb-chat-input"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="kb-chat-send-btn"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default KidChatModal;
