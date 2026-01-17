import { useState, useEffect } from 'react';
import { Trash2, Edit2, X, Check, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';
import '../styles/shared.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Checkins() {
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({ direction: '', checkin: '', data: '' });
  const [submitting, setSubmitting] = useState(false);

  // Carregar check-ins
  useEffect(() => {
    fetchCheckins();
  }, []);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/checkin`);
      setCheckins(response.data.checkins || []);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar check-ins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Deletar check-in
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que quer deletar esse check-in?')) {
      try {
        await axios.delete(`${API_BASE_URL}/checkin/${id}`);
        await fetchCheckins();
      } catch (err) {
        setError('Erro ao deletar check-in');
        console.error(err);
      }
    }
  };

  // Editar check-in
  const handleEditStart = (checkin) => {
    setEditingId(checkin.id);
    setEditingData({
      direction: checkin.direction,
      checkin: checkin.checkin,
      data: checkin.data
    });
  };

  const handleEditSave = async (id) => {
    if (!editingData.checkin.trim()) {
      alert('O local não pode estar vazio');
      return;
    }

    try {
      setSubmitting(true);
      await axios.put(`${API_BASE_URL}/checkin/${id}`, editingData);
      setEditingId(null);
      await fetchCheckins();
    } catch (err) {
      setError('Erro ao editar check-in');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingData({ direction: '', checkin: '', data: '' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDirectionIcon = (direction) => {
    return direction === 'in' 
      ? <ArrowDownCircle size={20} className="direction-icon-in" />
      : <ArrowUpCircle size={20} className="direction-icon-out" />;
  };

  const getDirectionText = (direction) => {
    return direction === 'in' ? 'Entrada' : 'Saída';
  };

  return (
    <div className="memorias-container">
      <div className="memorias-header">
        <h1>🚪 Check-ins e Check-outs</h1>
        <button
          className="btn-primary"
          onClick={fetchCheckins}
          disabled={loading}
        >
          <RefreshCw size={20} className={loading ? 'spinning' : ''} />
          Atualizar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Lista de Check-ins */}
      {loading ? (
        <div className="loading">Carregando check-ins...</div>
      ) : checkins.length === 0 ? (
        <div className="empty-state">
          🔍 Nenhum check-in registrado ainda
        </div>
      ) : (
        <div className="memorias-list">
          <div className="count-badge">{checkins.length} check-in(s)</div>
          {checkins.map((checkin) => (
            <div key={checkin.id} className="memoria-card checkin-card">
              {editingId === checkin.id ? (
                // Modo edição
                <div className="memoria-edit-mode">
                  <div className="checkin-edit-fields">
                    <div className="edit-field">
                      <label>Local:</label>
                      <input
                        type="text"
                        value={editingData.checkin}
                        onChange={(e) => setEditingData({ ...editingData, checkin: e.target.value })}
                        className="checkin-input-edit"
                      />
                    </div>
                    <div className="edit-field">
                      <label>Direção:</label>
                      <select
                        value={editingData.direction}
                        onChange={(e) => setEditingData({ ...editingData, direction: e.target.value })}
                        className="checkin-input-edit"
                      >
                        <option value="in">Entrada</option>
                        <option value="out">Saída</option>
                      </select>
                    </div>
                    <div className="edit-field">
                      <label>Data e Hora:</label>
                      <input
                        type="datetime-local"
                        value={editingData.data ? new Date(editingData.data).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditingData({ ...editingData, data: new Date(e.target.value).toISOString() })}
                        className="checkin-input-edit"
                      />
                    </div>
                  </div>
                  <div className="edit-actions">
                    <button
                      className="btn-success-small"
                      onClick={() => handleEditSave(checkin.id)}
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
                  <div className="checkin-content">
                    <div className="checkin-header">
                      <div className="checkin-icon-badge">
                        {getDirectionIcon(checkin.direction)}
                      </div>
                      <div className="checkin-info">
                        <h3 className="checkin-location">{checkin.checkin}</h3>
                        <span className={`checkin-direction-badge ${checkin.direction}`}>
                          {getDirectionText(checkin.direction)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="memoria-footer">
                    <span className="memoria-date">
                      📅 {formatDate(checkin.data)}
                    </span>
                    <div className="memoria-actions">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditStart(checkin)}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(checkin.id)}
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
