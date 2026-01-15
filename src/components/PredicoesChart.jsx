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
      
      // Criamos a data de amanhã para buscar dados que "viraram o dia" no UTC
      const dataAtualObj = new Date(data + 'T12:00:00');
      const amanhaObj = new Date(dataAtualObj);
      amanhaObj.setDate(dataAtualObj.getDate() + 1);
      const dataAmanha = amanhaObj.toISOString().split('T')[0];

      // URLs para hoje e amanhã
      const urlHoje = `${REACT_APP_API_URL}/predicoes?data=${data}&timezone=${TIMEZONE}&return_timezone=${TIMEZONE}&limit=1000${modelSelecionado ? `&model_name=${modelSelecionado}` : ''}`;
      const urlAmanha = `${REACT_APP_API_URL}/predicoes?data=${dataAmanha}&timezone=${TIMEZONE}&return_timezone=${TIMEZONE}&limit=1000${modelSelecionado ? `&model_name=${modelSelecionado}` : ''}`;

      // Busca ambos em paralelo. Se amanhã não tiver nada, o catch retorna vazio.
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
    const interval = setInterval(fetchPredicoes, 300000); // 5 min
    return () => clearInterval(interval);
  }, [fetchPredicoes]);

  const { dadosGrafico, modelosUnicos } = useMemo(() => {
    if (!predicoes.length) return { dadosGrafico: [], modelosUnicos: [] };

    // Definimos a janela de 24h baseada na DATA SELECIONADA (00:00 até 23:59 local)
    const inicioTs = new Date(`${data}T00:00:00`).getTime();
    const fimTs = new Date(`${data}T23:59:59`).getTime();

    const modelosSet = new Set();
    
    // Filtra e ordena pelo TIMESTAMP REAL (numérico)
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

    return { 
      dadosGrafico: Object.values(grupos), 
      modelosUnicos: Array.from(modelosSet) 
    };
  }, [predicoes, data]);

  const cores = {
    'academia_in': '#3b82f6', 'terco_in': '#ef4444', 'awake_in': '#10b981',
    'awake_out': '#f59e0b', 'EDIHB_in': '#8b5cf6', 'EDISEN_in': '#ec4899',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 mt-4 ml-2 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">📊 ML Predictions</h1>
            <p className="text-[10px] text-gray-400 font-mono">SYNC: {ultimaAtualizacao.toLocaleTimeString()}</p>
          </div>
        </header>

        {/* Filtros Mobile-Safe */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6 border border-gray-200 mx-2 flex flex-col gap-4">
          <div className="w-full">
            <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Data da Consulta</label>
            <input type="date" value={data} onChange={(e) => setData(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none" />
          </div>
          <div className="w-full">
            <label className="block text-xs uppercase font-bold text-gray-400 mb-1">Modelo</label>
            <select value={modelSelecionado} onChange={(e) => setModelSelecionado(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none">
              <option value="">Todos os modelos</option>
              {[...new Set(predicoes.map(p => p.model_name))].map(m => (
                <option key={m} value={m}>{limparNomeModelo(m)}</option>
              ))}
            </select>
          </div>
          <button onClick={fetchPredicoes} disabled={loading}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg shadow-md active:scale-95 disabled:opacity-50">
            {loading ? 'Processando...' : 'Atualizar Dashboard'}
          </button>
        </div>

        {/* Gráfico */}
        {dadosGrafico.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200 mx-2">
            <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 5, right: 5, left: -25, bottom: 65 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hora" tick={{fontSize: 9}} interval="preserveStartEnd" angle={-45} textAnchor="end" height={60} />
                  <YAxis unit="%" domain={[0, 100]} tick={{fontSize: 10}} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px' }} />
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