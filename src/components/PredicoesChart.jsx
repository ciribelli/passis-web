import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
const TIMEZONE = 'America/Sao_Paulo';

const PredicoesChart = () => {
  const [predicoes, setPredicoes] = useState([]);
  
  // DATA INICIAL LOCAL: Ajustada para não usar UTC puro
  const [data, setData] = useState(() => {
    const agora = new Date();
    const offset = agora.getTimezoneOffset() * 60000;
    return new Date(agora - offset).toISOString().split('T')[0];
  });

  const [modelSelecionado, setModelSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const limparNomeModelo = (nome) => nome.replace('modelo_artifacts_', '').replace('.joblib', '');

  const fetchPredicoes = useCallback(async () => {
    try {
      setLoading(true);
      setErro('');
      
      const params = new URLSearchParams({
        data: data,
        timezone: TIMEZONE,
        return_timezone: TIMEZONE,
        limit: '1000'
      });

      if (modelSelecionado) params.append('model_name', modelSelecionado);

      const response = await fetch(`${REACT_APP_API_URL}/predicoes?${params.toString()}`);
      const resultado = await response.json();
      
      if (response.ok) {
        setPredicoes(resultado.data || []);
      } else {
        setErro(resultado.error || 'Erro na requisição');
      }
    } catch (err) {
      setErro('Erro de conexão: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [data, modelSelecionado]);

  // AUTO-REFRESH: A cada 5 minutos
  useEffect(() => {
    fetchPredicoes();
    const interval = setInterval(fetchPredicoes, 300000); 
    return () => clearInterval(interval);
  }, [fetchPredicoes]);

  const { dadosGrafico, modelosUnicos } = useMemo(() => {
    if (!predicoes.length) return { dadosGrafico: [], modelosUnicos: [] };

    const modelosSet = new Set();
    
    // ORDENAÇÃO CRONOLÓGICA: Resolve o corte das 21h
    const ordenadas = [...predicoes].sort((a, b) => 
      new Date(a.inference_datetime.replace(' ', 'T')) - new Date(b.inference_datetime.replace(' ', 'T'))
    );

    const grupos = {};
    ordenadas.forEach(pred => {
      const dateObj = new Date(pred.inference_datetime.replace(' ', 'T'));
      const horaLabel = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const modeloLimpo = limparNomeModelo(pred.model_name);
      
      modelosSet.add(modeloLimpo);
      if (!grupos[horaLabel]) grupos[horaLabel] = { hora: horaLabel };
      grupos[horaLabel][modeloLimpo] = parseFloat((pred.prediction * 100).toFixed(2));
    });

    return { dadosGrafico: Object.values(grupos), modelosUnicos: Array.from(modelosSet) };
  }, [predicoes]);

  const cores = {
    'academia_in': '#3b82f6', 'terco_in': '#ef4444', 'awake_in': '#10b981',
    'awake_out': '#f59e0b', 'EDIHB_in': '#8b5cf6', 'EDISEN_in': '#ec4899',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 mt-4 ml-2">
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">📊 ML Predictions</h1>
        </header>

        {/* FILTROS: Corrigidos para não vazar no Mobile */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 mx-2">
          <div className="flex flex-col gap-5">
            <div className="w-full">
              <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Data da Consulta</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none appearance-none" />
            </div>
            <div className="w-full">
              <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Modelo</label>
              <select value={modelSelecionado} onChange={(e) => setModelSelecionado(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none">
                <option value="">Todos os modelos</option>
                {[...new Set(predicoes.map(p => p.model_name))].map(m => (
                  <option key={m} value={m}>{limparNomeModelo(m)}</option>
                ))}
              </select>
            </div>
            <button onClick={fetchPredicoes} disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow-md active:scale-95 disabled:opacity-50 transition-all">
              {loading ? 'Sincronizando...' : 'Atualizar Dashboard'}
            </button>
          </div>
        </div>

        {/* GRÁFICO: Otimizado para Mobile */}
        {dadosGrafico.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200 mx-2">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hora" tick={{fontSize: 9}} interval="preserveStartEnd" angle={-45} textAnchor="end" />
                  <YAxis unit="%" domain={[0, 100]} tick={{fontSize: 10}} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', paddingTop: '35px' }} />
                  {modelosUnicos.map(modelo => (
                    <Line key={modelo} type="monotone" dataKey={modelo} name={modelo}
                      stroke={cores[modelo] || '#94a3b8'} strokeWidth={2} dot={false} connectNulls />
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