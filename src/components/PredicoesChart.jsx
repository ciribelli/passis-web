import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

const TIMEZONE = 'America/Sao_Paulo';

const PredicoesChart = () => {
  const [predicoes, setPredicoes] = useState([]);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]); 
  const [modelSelecionado, setModelSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [pagination, setPagination] = useState(null);

  const limparNomeModelo = (nome) => nome.replace('modelo_artifacts_', '').replace('.joblib', '');

  const fetchPredicoes = async () => {
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
        setPagination(resultado.pagination);
      } else {
        setErro(resultado.error || 'Erro na requisição');
        setPredicoes([]);
      }
    } catch (err) {
      setErro('Erro de conexão: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const { dadosGrafico, modelosUnicos } = useMemo(() => {
    if (!predicoes.length) return { dadosGrafico: [], modelosUnicos: [] };

    const modelosSet = new Set();
    const predicoesDoDia = predicoes.filter(pred => pred.inference_datetime.startsWith(data));

    const predicoesOrdenadas = [...predicoesDoDia].sort((a, b) => {
      return new Date(a.inference_datetime.replace(' ', 'T')) - new Date(b.inference_datetime.replace(' ', 'T'));
    });

    const grupos = {};
    predicoesOrdenadas.forEach(pred => {
      const horaLabel = new Date(pred.inference_datetime.replace(' ', 'T'))
        .toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      const modeloLimpo = limparNomeModelo(pred.model_name);
      modelosSet.add(modeloLimpo);
      
      if (!grupos[horaLabel]) grupos[horaLabel] = { hora: horaLabel };
      grupos[horaLabel][modeloLimpo] = parseFloat((pred.prediction * 100).toFixed(2));
    });

    return { dadosGrafico: Object.values(grupos), modelosUnicos: Array.from(modelosSet) };
  }, [predicoes, data]);

  const cores = {
    'academia_in': '#3b82f6',
    'terco_in': '#ef4444',
    'awake_in': '#10b981',
    'awake_out': '#f59e0b',
    'EDIHB_in': '#8b5cf6',
    'EDISEN_in': '#ec4899',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">📊 ML Predictions</h1>
            <p className="text-gray-500">Monitoramento de probabilidade por modelo</p>
          </div>
          {loading && <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>}
        </header>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Data</label>
              <input type="date" value={data} onChange={(e) => setData(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider font-bold text-gray-400 mb-2">Modelo</label>
              <select value={modelSelecionado} onChange={(e) => setModelSelecionado(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all">
                <option value="">Todos os modelos</option>
                {[...new Set(predicoes.map(p => p.model_name))].map(m => (
                  <option key={m} value={m}>{limparNomeModelo(m)}</option>
                ))}
              </select>
            </div>
            <button onClick={fetchPredicoes} disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-lg shadow-blue-200 transition-all disabled:opacity-50">
              {loading ? 'Sincronizando...' : 'Atualizar Dashboard'}
            </button>
          </div>
        </div>

        {erro && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg">{erro}</div>}

        {/* Gráfico */}
        {dadosGrafico.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-lg font-bold text-gray-800">Probabilidade no Tempo</h2>
              <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800">Live Data</span>
            </div>
            <div className="h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hora" tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis unit="%" domain={[0, 100]} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} />
                  
                  {/* Tooltip Ajustada: Agora mostra o nome do modelo correto em cada linha */}
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                    formatter={(value, name) => [`${value}%`, `Modelo: ${name}`]}
                  />
                  
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  {modelosUnicos.map(modelo => (
                    <Line
                      key={modelo}
                      type="monotone"
                      dataKey={modelo}
                      name={modelo}
                      stroke={cores[modelo] || '#94a3b8'}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabela de Dados */}
        {predicoes.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-700 uppercase text-xs tracking-widest">Logs de Inferência</h3>
              <span className="text-xs text-gray-400">Total: {pagination?.total}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white border-b border-gray-100">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Timestamp</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase">Modelo</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase text-right">Predição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {predicoes.slice(0, 15).map((pred, i) => (
                    <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                      <td className="p-4 text-sm text-gray-600 font-mono">
                        {pred.inference_datetime}
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                              style={{ color: cores[limparNomeModelo(pred.model_name)], backgroundColor: `${cores[limparNomeModelo(pred.model_name)]}15` }}>
                          {limparNomeModelo(pred.model_name)}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-bold text-gray-900">{(pred.prediction * 100).toFixed(2)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PredicoesChart;