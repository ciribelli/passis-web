import { useState, useEffect } from 'react';
import { Trash2, Edit2, Plus, Search, X, Check, Download, Upload, FileText, Eye } from 'lucide-react';
import axios from 'axios';
import '../styles/shared.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function Documentos() {
  const [documentos, setDocumentos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Estados para novo documento
  const [newDocumento, setNewDocumento] = useState({
    nome_do_documento: '',
    descricao: '',
    file: null
  });

  // Estados para edição
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({
    nome_do_documento: '',
    descricao: ''
  });

  // Carregar documentos
  useEffect(() => {
    fetchDocumentos();
  }, []);

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/recuperar_lista_documentos`);
      setDocumentos(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar documentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Upload de novo documento
  const handleUpload = async () => {
    if (!newDocumento.nome_do_documento.trim()) {
      alert('Por favor, informe o nome do documento');
      return;
    }

    if (!newDocumento.file) {
      alert('Por favor, selecione um arquivo');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('nome_do_documento', newDocumento.nome_do_documento);
      formData.append('descricao', newDocumento.descricao || '');
      formData.append('arquivo', newDocumento.file);

      await axios.post(`${API_BASE_URL}/criar_documento`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setNewDocumento({ nome_do_documento: '', descricao: '', file: null });
      setShowForm(false);
      await fetchDocumentos();
    } catch (err) {
      setError('Erro ao fazer upload do documento');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Deletar documento
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que quer deletar esse documento?')) {
      try {
        await axios.delete(`${API_BASE_URL}/excluir_documento/${id}`);
        await fetchDocumentos();
      } catch (err) {
        setError('Erro ao deletar documento');
        console.error(err);
      }
    }
  };

  // Editar documento (apenas metadados)
  const handleEditStart = (documento) => {
    setEditingId(documento.id);
    setEditingData({
      nome_do_documento: documento.nome_do_documento,
      descricao: documento.descricao || ''
    });
  };

  const handleEditSave = async (id) => {
    if (!editingData.nome_do_documento.trim()) {
      alert('O nome do documento não pode estar vazio');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('nome_do_documento', editingData.nome_do_documento);
      formData.append('descricao', editingData.descricao || '');

      await axios.put(`${API_BASE_URL}/atualizar_documento/${id}`, formData);
      setEditingId(null);
      await fetchDocumentos();
    } catch (err) {
      setError('Erro ao editar documento');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingData({ nome_do_documento: '', descricao: '' });
  };

  // Função auxiliar para detectar o tipo MIME baseado na extensão do arquivo
  const getMimeType = (filename) => {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      // Imagens
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      // Documentos
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      // Texto
      'txt': 'text/plain',
      'csv': 'text/csv',
      'html': 'text/html',
      'xml': 'text/xml',
      // Outros
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      '7z': 'application/x-7z-compressed',
      'json': 'application/json'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  // Download de documento
  const handleDownload = async (id, nomeDocumento) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/recuperar_documento/${id}`, {
        responseType: 'blob'
      });

      const mimeType = getMimeType(nomeDocumento);
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', nomeDocumento);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erro ao fazer download do documento');
      console.error(err);
    }
  };

  // Visualizar documento (abre em nova aba)
  const handleView = async (id, nomeDocumento) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/recuperar_documento/${id}`, {
        responseType: 'blob'
      });

      const mimeType = getMimeType(nomeDocumento);
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      // Para PDFs e imagens, abrir em nova aba
      // Para outros tipos, pode não visualizar corretamente, então fazemos download
      if (mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('text/')) {
        window.open(url, '_blank');
        // Limpar o URL após um tempo
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      } else {
        // Para outros tipos, fazer download
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', nomeDocumento);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Erro ao visualizar documento');
      console.error(err);
    }
  };

  // Filtrar documentos
  const filteredDocumentos = documentos.filter(doc =>
    doc.nome_do_documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (doc.descricao && doc.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${kb.toFixed(2)} KB`;
  };

  return (
    <div className="memorias-container">
      <div className="memorias-header">
        <h1>📄 Meus Documentos</h1>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} />
          {showForm ? 'Cancelar' : 'Novo Documento'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Formulário para upload de documento */}
      {showForm && (
        <div className="new-memoria-form">
          <div className="form-group">
            <label htmlFor="nome-documento">Nome do Documento *</label>
            <input
              id="nome-documento"
              type="text"
              value={newDocumento.nome_do_documento}
              onChange={(e) => setNewDocumento({ ...newDocumento, nome_do_documento: e.target.value })}
              placeholder="Ex: Contrato de Prestação de Serviços"
              className="search-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="descricao-documento">Descrição</label>
            <textarea
              id="descricao-documento"
              value={newDocumento.descricao}
              onChange={(e) => setNewDocumento({ ...newDocumento, descricao: e.target.value })}
              placeholder="Descrição opcional do documento"
              className="memoria-textarea"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label htmlFor="file-upload">Arquivo *</label>
            <input
              id="file-upload"
              type="file"
              onChange={(e) => setNewDocumento({ ...newDocumento, file: e.target.files[0] })}
              className="file-input"
            />
            {newDocumento.file && (
              <div className="file-info">
                📎 {newDocumento.file.name} ({formatFileSize(newDocumento.file.size)})
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              className="btn-success"
              onClick={handleUpload}
              disabled={submitting}
            >
              <Upload size={18} />
              {submitting ? 'Enviando...' : 'Enviar Documento'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => {
                setShowForm(false);
                setNewDocumento({ nome_do_documento: '', descricao: '', file: null });
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
          placeholder="Buscar documentos..."
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

      {/* Lista de documentos */}
      {loading ? (
        <div className="loading">Carregando documentos...</div>
      ) : filteredDocumentos.length === 0 ? (
        <div className="empty-state">
          {documentos.length === 0
            ? '📁 Nenhum documento ainda. Faça o upload do primeiro!'
            : '🔍 Nenhum documento encontrado com esse termo'}
        </div>
      ) : (
        <div className="memorias-list">
          <div className="count-badge">{filteredDocumentos.length} documento(s)</div>
          {filteredDocumentos.map((doc) => (
            <div key={doc.id} className="memoria-card">
              {editingId === doc.id ? (
                // Modo edição
                <div className="memoria-edit-mode">
                  <div className="form-group">
                    <label>Nome do Documento</label>
                    <input
                      type="text"
                      value={editingData.nome_do_documento}
                      onChange={(e) => setEditingData({ ...editingData, nome_do_documento: e.target.value })}
                      className="search-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Descrição</label>
                    <textarea
                      value={editingData.descricao}
                      onChange={(e) => setEditingData({ ...editingData, descricao: e.target.value })}
                      className="memoria-textarea-edit"
                      rows="2"
                    />
                  </div>
                  <div className="edit-actions">
                    <button
                      className="btn-success-small"
                      onClick={() => handleEditSave(doc.id)}
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
                  <div className="documento-header">
                    <FileText size={24} className="documento-icon" />
                    <div className="documento-info">
                      <h3 className="documento-title">{doc.nome_do_documento}</h3>
                      {doc.descricao && (
                        <p className="documento-descricao">{doc.descricao}</p>
                      )}
                    </div>
                  </div>

                  <div className="documento-metadata">
                    <span className="metadata-item">
                      📅 Upload: {formatDate(doc.data_de_upload)}
                    </span>
                    {doc.versao && (
                      <span className="metadata-item">
                        🔢 Versão: {doc.versao}
                      </span>
                    )}
                  </div>

                  <div className="memoria-footer">
                    <div className="memoria-actions">
                      <button
                        className="btn-icon btn-view"
                        onClick={() => handleView(doc.id, doc.nome_do_documento)}
                        title="Visualizar"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        className="btn-icon btn-download"
                        onClick={() => handleDownload(doc.id, doc.nome_do_documento)}
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => handleEditStart(doc)}
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => handleDelete(doc.id)}
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
