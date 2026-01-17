import { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Search, X, Check } from 'lucide-react';
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

  // Criar nova memória
  const handleCreate = async () => {
    if (!newContent.trim()) {
      alert('Por favor, escreva algo na memória');
      return;
    }

    try {
      setSubmitting(true);
      await axios.post(`${API_BASE_URL}/memorias`, { content: newContent });
      setNewContent('');
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
  };

  const handleEditSave = async (id) => {
    if (!editingContent.trim()) {
      alert('A memória não pode estar vazia');
      return;
    }

    try {
      setSubmitting(true);
      // Como a API não tem PUT, vamos usar DELETE + CREATE
      await axios.delete(`${API_BASE_URL}/memorias/${id}`);
      await axios.post(`${API_BASE_URL}/memorias`, { content: editingContent });
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

  // Filtrar memórias
  const filteredMemorias = memorias.filter(memoria =>
    memoria.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
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
          onClick={() => setShowForm(!showForm)}
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

      {/* Lista de memórias */}
      {loading ? (
        <div className="loading">Carregando memórias...</div>
      ) : filteredMemorias.length === 0 ? (
        <div className="empty-state">
          {memorias.length === 0
            ? '📚 Nenhuma memória ainda. Crie a primeira!'
            : '🔍 Nenhuma memória encontrada com esse termo'}
        </div>
      ) : (
        <div className="memorias-list">
          <div className="count-badge">{filteredMemorias.length} memória(s)</div>
          {filteredMemorias.map((memoria) => (
            <div key={memoria.id} className="memoria-card">
              {editingId === memoria.id ? (
                // Modo edição
                <div className="memoria-edit-mode">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    className="memoria-textarea-edit"
                    rows="3"
                  />
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
