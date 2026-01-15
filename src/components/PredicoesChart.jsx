import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

      <div className="max-w-7xl mx-auto">
        <header className="mb-6 mt-4 px-2 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">📊 Predictions</h1>
            <p className="text-[10px] text-gray-400 font-mono">ÚLTIMA SYNC: {ultimaAtualizacao.toLocaleTimeString()}</p>
          </div>
          {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mb-1"></div>}
        </header>

        {/* Filtros Ajustados para Mobile */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 border border-gray-200 mx-2">
          <div className="flex flex-col gap-4">
            <div className="w-full overflow-hidden">
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1.5 ml-1">Data da Consulta</label>
              <input 
                type="date" 
                value={data} 
                onChange={(e) => setData(e.target.value)}
                style={{ minWidth: '100%', WebkitAppearance: 'none' }}
                className="w-full block px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-700 focus:bg-white focus:border-blue-400 transition-all" 
              />
            </div>
            
            <div className="w-full">
              <label className="block text-xs uppercase font-bold text-gray-400 mb-1.5 ml-1">Modelo</label>
              <select 
                value={modelSelecionado} 
                onChange={(e) => setModelSelecionado(e.target.value)}
                className="w-full block px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none text-gray-700 focus:bg-white focus:border-blue-400 transition-all"
              >
                <option value="">Todos os modelos</option>
                {[...new Set(predicoes.map(p => p.model_name))].map(m => (
                  <option key={m} value={m}>{limparNomeModelo(m)}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={fetchPredicoes} 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-md active:scale-[0.98] transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Carregando...' : 'Atualizar Dashboard'}
            </button>
          </div>
        </div>

        {/* Gráfico com Live Pulsante */}
        {dadosGrafico.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200 mx-2">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Probabilidade (%)</h2>
              <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse-soft"></span>
                <span className="text-[10px] font-extrabold text-blue-600 tracking-tight">LIVE MONITOR</span>
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
