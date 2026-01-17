import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/shared.css';
import '../styles/dashboard-addon.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
const TIMEZONE = 'America/Sao_Paulo';

const PredicoesChart = () => {
  const [predicoes, setPredicoes] = useState([]);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]); 
  const [modelSelecionado, setModelSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());

  const limparNomeModelo = (nome) => nome.replace('modelo_artifacts_', '').replace('.joblib', '');

  const fetchPredicoes = useCallback(async () => {
    try {
      setLoading(true);
      setErro('');
      
      const dataAtualObj = new Date(data + 'T12:00:00');
      const amanhaObj = new Date(dataAtualObj);
      amanhaObj.setDate(dataAtualObj.getDate() + 1);
      const dataAmanha = amanhaObj.toISOString().split('T')[0];

      const urlHoje = `${REACT_APP_API_URL}/predicoes?data=${data}&timezone=${TIMEZONE}&return_timezone=${TIMEZONE}&limit=1000${modelSelecionado ? `&model_name=${modelSelecionado}` : ''}`;
      const urlAmanha = `${REACT_APP_API_URL}/predicoes?data=${dataAmanha}&timezone=${TIMEZONE}&return_timezone=${TIMEZONE}&limit=1000${modelSelecionado ? `&model_name=${modelSelecionado}` : ''}`;

      const [resHoje, resAmanha] = await Promise.all([
        fetch(urlHoje).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(urlAmanha).then(r => r.json()).catch(() => ({ data: [] }))
      ]);
      
      const combinados = [...(resHoje.data || []), ...(resAmanha.data || [])];
      setPredicoes(combinados);
      setUltimaAtualizacao(new Date());
    } catch (err) {
      setErro('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [data, modelSelecionado]);

  useEffect(() => {
    fetchPredicoes();
    const interval = setInterval(fetchPredicoes, 300000); 
    return () => clearInterval(interval);
  }, [fetchPredicoes]);

  const { dadosGrafico, modelosUnicos } = useMemo(() => {
    if (!predicoes.length) return { dadosGrafico: [], modelosUnicos: [] };

    const inicioTs = new Date(`${data}T00:00:00`).getTime();
    const fimTs = new Date(`${data}T23:59:59`).getTime();
    const modelosSet = new Set();
    
    const processados = predicoes
      .map(p => ({
        ...p,
        ts: new Date(p.inference_datetime.replace(' ', 'T')).getTime()
      }))
      .filter(p => p.ts >= inicioTs && p.ts <= fimTs)
      .sort((a, b) => a.ts - b.ts);

    const grupos = {};
    processados.forEach(pred => {
      const horaLabel = new Date(pred.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const modeloLimpo = limparNomeModelo(pred.model_name);
      modelosSet.add(modeloLimpo);
      
      if (!grupos[horaLabel]) grupos[horaLabel] = { hora: horaLabel };
      grupos[horaLabel][modeloLimpo] = parseFloat((pred.prediction * 100).toFixed(2));
    });

    return { dadosGrafico: Object.values(grupos), modelosUnicos: Array.from(modelosSet) };
  }, [predicoes, data]);

  const cores = {
    'academia_in': '#3b82f6', 'terco_in': '#ef4444', 'awake_in': '#10b981',
    'awake_out': '#f59e0b', 'EDIHB_in': '#8b5cf6', 'EDISEN_in': '#ec4899',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8 font-sans">
      {/* Estilo para o 'Live' piscando */}
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      <div className="dashboard-container">
        <div className="memorias-header">
          <h1>📊 Predições</h1>
          <button
            className="btn-primary"
            onClick={fetchPredicoes}
            disabled={loading}
          >
            <span className={loading ? 'spinning' : ''}>🔄</span>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
        <div className="dashboard-sync-info">
          <span>Última atualização: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}</span>
        </div>

        {/* Filtros */}
        <div className="dashboard-filters-card">
          <div className="dashboard-filters">
            <div className="edit-field">
              <label>Data da Consulta</label>
              <input 
                type="date" 
                value={data} 
                onChange={(e) => setData(e.target.value)}
                className="checkin-input-edit" 
              />
            </div>
            
            <div className="edit-field">
              <label>Modelo</label>
              <select 
                value={modelSelecionado} 
                onChange={(e) => setModelSelecionado(e.target.value)}
                className="checkin-input-edit"
              >
                <option value="">Todos os modelos</option>
                {[...new Set(predicoes.map(p => p.model_name))].map(m => (
                  <option key={m} value={m}>{limparNomeModelo(m)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Gráfico com Live Pulsante */}
        {dadosGrafico.length > 0 && (
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-header">
              <h2>Probabilidade (%)</h2>
              <div className="live-badge">
                <span className="live-dot"></span>
                <span>LIVE MONITOR</span>
              </div>
            </div>

            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 65 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hora" 
                    tick={{fontSize: 9, fill: '#94a3b8'}} 
                    interval="preserveStartEnd" 
                    angle={-45} 
                    textAnchor="end" 
                    height={60} 
                  />
                  <YAxis unit="%" domain={[0, 100]} tick={{fontSize: 10, fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', paddingTop: '40px' }} />
                  {modelosUnicos.map(modelo => (
                    <Line key={modelo} type="monotone" dataKey={modelo} name={modelo} stroke={cores[modelo] || '#94a3b8'} strokeWidth={2.5} dot={false} connectNulls />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredicoesChart;
