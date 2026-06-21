import { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Search, X, Check, Clock, Bell } from 'lucide-react';
import axios from 'axios';
import '../styles/shared.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Memorias() {
  const [memorias, setMemorias] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Estados para controle de Lembretes / Abas
  const [activeTab, setActiveTab] = useState('todas'); // 'todas', 'memorias', 'lembretes'
  const [isReminder, setIsReminder] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  
  // Estados para edição
  const [editIsReminder, setEditIsReminder] = useState(false);
  const [editReminderTime, setEditReminderTime] = useState('');
  const [editReminderStatus, setEditReminderStatus] = useState('pendente');

  // Carregar memórias
  useEffect(() => {
    fetchMemorias();
  }, []);

  const fetchMemorias = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/memorias`);
      setMemorias(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar memórias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Criar nova memória/lembrete
  const handleCreate = async () => {
    if (!newContent.trim()) {
      alert('Por favor, escreva algo na memória');
      return;
    }

    if (isReminder && !reminderTime) {
      alert('Por favor, defina a data e hora do alarme para o lembrete');
      return;
    }

    try {
      setSubmitting(true);
      const payload = { content: newContent };
      if (isReminder && reminderTime) {
        // Envia no formato esperado pelo backend: YYYY-MM-DD HH:MM:00
        payload.reminder_time = reminderTime.replace('T', ' ') + ':00';
      }

      await axios.post(`${API_BASE_URL}/memorias`, payload);
      setNewContent('');
      setIsReminder(false);
      setReminderTime('');
      setShowForm(false);
      await fetchMemorias();
    } catch (err) {
      setError('Erro ao criar memória');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Deletar memória
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que quer deletar essa memória?')) {
      try {
        await axios.delete(`${API_BASE_URL}/memorias/${id}`);
        await fetchMemorias();
      } catch (err) {
        setError('Erro ao deletar memória');
        console.error(err);
      }
    }
  };

  // Editar memória
  const handleEditStart = (memoria) => {
    setEditingId(memoria.id);
    setEditingContent(memoria.content);
    if (memoria.reminder_time) {
      setEditIsReminder(true);
      // Converte YYYY-MM-DD HH:MM:SS para formato datetime-local: YYYY-MM-DDTHH:MM
      const formattedTime = memoria.reminder_time.replace(' ', 'T').substring(0, 16);
      setEditReminderTime(formattedTime);
      setEditReminderStatus(memoria.reminder_status || 'pendente');
    } else {
      setEditIsReminder(false);
      setEditReminderTime('');
      setEditReminderStatus('pendente');
    }
  };

  const handleEditSave = async (id) => {
    if (!editingContent.trim()) {
      alert('A memória não pode estar vazia');
      return;
    }

    if (editIsReminder && !editReminderTime) {
      alert('Por favor, defina a data e hora do alarme para o lembrete');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        content: editingContent,
        reminder_time: editIsReminder && editReminderTime ? editReminderTime.replace('T', ' ') + ':00' : null,
        reminder_status: editIsReminder ? editReminderStatus : null
      };

      await axios.put(`${API_BASE_URL}/memorias/${id}`, payload);
      setEditingId(null);
      await fetchMemorias();
    } catch (err) {
      setError('Erro ao editar memória');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingContent('');
  };

  // Filtrar memórias baseada no termo de busca e na aba ativa
  const filteredMemorias = memorias.filter(memoria => {
    const matchesSearch = memoria.content.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'memorias') {
      return !memoria.reminder_time;
    } else if (activeTab === 'lembretes') {
      return !!memoria.reminder_time;
    }
    return true;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Substitui espaço por T para suportar compatibilidade de parse de data em múltiplos navegadores
    const date = new Date(dateString.replace(' ', 'T'));
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="memorias-container">
      <div className="memorias-header">
        <h1>📝 Minhas Memórias</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setShowForm(!showForm);
            setIsReminder(false);
            setReminderTime('');
          }}
        >
          <Plus size={20} />
          {showForm ? 'Cancelar' : 'Nova Memória'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Formulário para criar memória */}
      {showForm && (
        <div className="new-memoria-form">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="O que você quer lembrar?"
            className="memoria-textarea"
            rows="4"
          />

          <label className="form-checkbox-group">
            <input
              type="checkbox"
              checked={isReminder}
              onChange={(e) => {
                setIsReminder(e.target.checked);
                if (!e.target.checked) setReminderTime('');
              }}
            />
            ⏰ Definir data/hora de lembrete (Alarme)?
          </label>

          {isReminder && (
            <div className="datetime-container">
              <label htmlFor="reminder-time-input">Data e hora do alarme:</label>
              <input
                id="reminder-time-input"
                type="datetime-local"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                className="datetime-input"
              />
            </div>
          )}

          <div className="form-actions">
            <button
              className="btn-success"
              onClick={handleCreate}
              disabled={submitting}
            >
              {submitting ? 'Salvando...' : 'Salvar Memória'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowForm(false);
                setNewContent('');
                setIsReminder(false);
                setReminderTime('');
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Campo de busca */}
      <div className="search-container">
        <Search size={20} />
        <input
          type="text"
          placeholder="Buscar memórias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        {searchTerm && (
          <button
            className="btn-clear"
            onClick={() => setSearchTerm('')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Abas de Filtragem (Tabs) */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'todas' ? 'active' : ''}`}
          onClick={() => setActiveTab('todas')}
        >
          Todas
        </button>
        <button
          className={`tab-btn ${activeTab === 'memorias' ? 'active memorias-only' : ''}`}
          onClick={() => setActiveTab('memorias')}
        >
          Memórias
        </button>
        <button
          className={`tab-btn ${activeTab === 'lembretes' ? 'active lembretes' : ''}`}
          onClick={() => setActiveTab('lembretes')}
        >
          Lembretes
        </button>
      </div>

      {/* Lista de memórias */}
      {loading ? (
        <div className="loading">Carregando memórias...</div>
      ) : filteredMemorias.length === 0 ? (
        <div className="empty-state">
          {memorias.length === 0
            ? '📚 Nenhuma memória ou lembrete ainda. Crie o primeiro!'
            : '🔍 Nenhum item encontrado com esse termo'}
        </div>
      ) : (
        <div className="memorias-list">
          <div className="count-badge">
            {filteredMemorias.length} {activeTab === 'lembretes' ? 'lembrete(s)' : activeTab === 'memorias' ? 'memória(s)' : 'item(ns)'}
          </div>
          {filteredMemorias.map((memoria) => (
            <div key={memoria.id} className={`memoria-card ${memoria.reminder_time ? 'lembrete-card' : ''}`}>
              {editingId === memoria.id ? (
                // Modo edição
                <div className="memoria-edit-mode">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="memoria-textarea-edit"
                    rows="3"
                  />

                  <div className="edit-lembrete-fields">
                    <label className="edit-checkbox-group">
                      <input
                        type="checkbox"
                        checked={editIsReminder}
                        onChange={(e) => {
                          setEditIsReminder(e.target.checked);
                          if (!e.target.checked) setEditReminderTime('');
                        }}
                      />
                      Definir data/hora de lembrete?
                    </label>

                    {editIsReminder && (
                      <div className="edit-datetime-container">
                        <label htmlFor="edit-reminder-time-input">Data e hora do alarme:</label>
                        <input
                          id="edit-reminder-time-input"
                          type="datetime-local"
                          value={editReminderTime}
                          onChange={(e) => setEditReminderTime(e.target.value)}
                          className="edit-datetime-input"
                        />

                        {memoria.reminder_time && (
                          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', color: '#7f8c8d', margin: 0 }}>Status:</label>
                            <select
                              value={editReminderStatus}
                              onChange={(e) => setEditReminderStatus(e.target.value)}
                              style={{ padding: '6px', borderRadius: '4px', border: '1px solid #bdc3c7', fontSize: '0.85rem', color: '#2c3e50', background: 'white' }}
                            >
                              <option value="pendente">Pendente</option>
                              <option value="enviado">Enviado</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="edit-actions">
                    <button
                      className="btn-success-small"
                      onClick={() => handleEditSave(memoria.id)}
                      disabled={submitting}
                      title="Salvar"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      className="btn-secondary-small"
                      onClick={handleEditCancel}
                      title="Cancelar"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                // Modo visualização
                <>
                  <div className="memoria-content">
                    <p>{memoria.content}</p>

                    {/* Exibição específica para lembretes */}
                    {memoria.reminder_time && (
                      <div className="reminder-info">
                        <Bell size={16} />
                        <span>
                          Alarme: <strong>{formatDate(memoria.reminder_time)}</strong>
                        </span>
                        <span className={`status-badge status-${memoria.reminder_status}`}>
                          {memoria.reminder_status === 'enviado' ? 'Enviado' : 'Pendente'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="memoria-footer">
                    <span className="memoria-date">
                      📅 {formatDate(memoria.date_created)}
                    </span>
                    <div className="memoria-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditStart(memoria)}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(memoria.id)}
                        title="Deletar"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
