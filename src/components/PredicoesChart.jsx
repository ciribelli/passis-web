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
      
      const params = new URLSearchParams({
        data: data,
        timezone: TIMEZONE,
        return_timezone: TIMEZONE,
        limit: '1000'
      });

      if (modelSelecionado) {
        params.append('model_name', modelSelecionado);
      }

      const response = await fetch(`${REACT_APP_API_URL}/predicoes?${params.toString()}`);
      const resultado = await response.json();
      
      if (response.ok) {
        setPredicoes(resultado.data || []);
        setUltimaAtualizacao(new Date());
      } else {
        setErro(resultado.error || 'Erro na requisição');
        setPredicoes([]);
      }
    } catch (err) {
      setErro('Erro de conexão: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [data, modelSelecionado]);

  // AUTO-REFRESH: Atualiza a cada 5 minutos
  useEffect(() => {
    fetchPredicoes();
    const interval = setInterval(fetchPredicoes, 300000); 
    return () => clearInterval(interval);
  }, [fetchPredicoes]);

  const { dadosGrafico, modelosUnicos } = useMemo(() => {
    if (!predicoes.length) return { dadosGrafico: [], modelosUnicos: [] };

    const modelosSet = new Set();
    
    // 1. Ordenação cronológica real pelo timestamp completo (Data + Hora)
    // Isso evita que 00:40 (UTC dia seguinte) apareça antes de 22:00 (Brasília dia atual)
    const predicoesOrdenadas = [...predicoes].sort((a, b) => {
      return new Date(a.inference_datetime.replace(' ', 'T')) - 
             new Date(b.inference_datetime.replace(' ', 'T'));
    });

    const grupos = {};
    predicoesOrdenadas.forEach(pred => {
      const dataObj = new Date(pred.inference_datetime.replace(' ', 'T'));
      const horaLabel = dataObj.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const modeloLimpo = limparNomeModelo(pred.model_name);
      modelosSet.add(modeloLimpo);
      
      if (!grupos[horaLabel]) {
        grupos[horaLabel] = { hora: horaLabel };
      }
      grupos[horaLabel][modeloLimpo] = parseFloat((pred.prediction * 100).toFixed(2));
    });

    return { 
      dadosGrafico: Object.values(grupos), 
      modelosUnicos: Array.from(modelosSet) 
    };
  }, [predicoes]);

  const cores = {
    'academia_in': '#3b82f6',
    'terco_in': '#ef4444',
    'awake_in': '#10b981',
    'awake_out': '#f59e0b',
    'EDIHB_in': '#8b5cf6',
    'EDISEN_in': '#ec4899',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-6 mt-4 ml-2 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              📊 ML Predictions
            </h1>
            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-1">
              Última sincronização: {ultimaAtualizacao.toLocaleTimeString('pt-BR')}
            </p>
          </div>
          {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mb-2"></div>}
        </header>

        {/* Filtros Mobile-First */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 mx-2">
          <div className="flex flex-col gap-5">
            <div className="w-full">
              <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Data da Consulta</label>
              <input 
                type="date" 
                value={data} 
                onChange={(e) => setData(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none" 
              />
            </div>
            <div className="w-full">
              <label className="block text-xs uppercase font-bold text-gray-400 mb-2">Modelo</label>
              <select 
                value={modelSelecionado} 
                onChange={(e) => setModelSelecionado(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? 'Sincronizando...' : 'Atualizar Dashboard'}
            </button>
          </div>
        </div>

        {erro && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 mx-2 text-sm">{erro}</div>}

        {/* Gráfico Otimizado */}
        {dadosGrafico.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200 mx-2 overflow-hidden">
            <div className="flex justify-between items-center mb-6 px-1">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Probabilidade no Tempo (%)</h2>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 border border-blue-100">LIVE DATA</span>
            </div>
            <div className="h-[380px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="hora" 
                    tick={{fontSize: 9, fill: '#94a3b8'}} 
                    interval="preserveStartEnd"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    unit="%" 
                    domain={[0, 100]} 
                    tick={{fontSize: 10, fill: '#94a3b8'}} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      fontSize: '11px' 
                    }}
                    formatter={(value, name) => [`${value}%`, name]}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ 
                      fontSize: '10px', 
                      paddingTop: '40px',
                      paddingLeft: '20px',
                      width: '100%' 
                    }}
                  />
                  {modelosUnicos.map(modelo => (
                    <Line
                      key={modelo}
                      type="monotone"
                      dataKey={modelo}
                      name={modelo}
                      stroke={cores[modelo] || '#cbd5e1'}
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                      connectNulls
                    />
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