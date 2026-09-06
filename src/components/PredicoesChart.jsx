import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import '../styles/shared.css';
import '../styles/dashboard-addon.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'https://passis-bfd9b877f7d0.herokuapp.com';
const PASSIS_API_KEY = process.env.REACT_APP_PASSIS_API_KEY || 'Av100bl09203';
const TIMEZONE = 'America/Sao_Paulo';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    const checkinsNoHorario = dataPoint.checkinsReais || [];

    return (
      <div style={{
        backgroundColor: '#ffffff',
        padding: '12px',
        borderRadius: '12px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
        border: '1px solid #e2e8f0',
        fontSize: '12px',
        maxWidth: '280px'
      }}>
        <div style={{ fontWeight: 'bold', color: '#334155', marginBottom: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
          🕒 Horário: {label}
        </div>

        {checkinsNoHorario.length > 0 && (
          <div style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            padding: '8px',
            borderRadius: '8px',
            marginBottom: '8px',
            border: '1px solid #a7f3d0'
          }}>
            <div style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              📍 Check-in Real Registrado
            </div>
            {checkinsNoHorario.map((c, idx) => (
              <div key={idx} style={{ fontSize: '11px' }}>
                • <strong>{c.checkin}</strong> ({c.direction === 'in' ? 'Entrada 🟢' : 'Saída 🔴'}) às {c.hora}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.5px' }}>
            Predições do Modelo
          </div>
          {payload.map((entry, index) => (
            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: entry.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: entry.color, display: 'inline-block' }}></span>
                {entry.name}
              </span>
              <span style={{ fontWeight: 'bold', fontFamily: 'monospace', color: entry.color }}>
                {entry.value}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const PredicoesChart = () => {
  const [predicoes, setPredicoes] = useState([]);
  const [checkins, setCheckins] = useState([]);
  const [exibirCheckins, setExibirCheckins] = useState(true);
  const [data, setData] = useState(new Date().toISOString().split('T')[0]); 
  const [modelSelecionado, setModelSelecionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState(new Date());

  const limparNomeModelo = (nome) => nome.replace('modelo_artifacts_', '').replace('.joblib', '');

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro('');
      
      const dataAtualObj = new Date(data + 'T12:00:00');
      const amanhaObj = new Date(dataAtualObj);
      amanhaObj.setDate(dataAtualObj.getDate() + 1);
      const dataAmanha = amanhaObj.toISOString().split('T')[0];

      const urlHoje = `${REACT_APP_API_URL}/predicoes?data=${data}&timezone=${TIMEZONE}&return_timezone=${TIMEZONE}&limit=1000${modelSelecionado ? `&model_name=${modelSelecionado}` : ''}`;
      const urlAmanha = `${REACT_APP_API_URL}/predicoes?data=${dataAmanha}&timezone=${TIMEZONE}&return_timezone=${TIMEZONE}&limit=1000${modelSelecionado ? `&model_name=${modelSelecionado}` : ''}`;
      const urlCheckin = `${REACT_APP_API_URL}/checkin?start_date=${data}&end_date=${data}&limit=200`;

      const [resHoje, resAmanha, resCheckin] = await Promise.all([
        fetch(urlHoje).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(urlAmanha).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(urlCheckin, { headers: { 'X-API-Key': PASSIS_API_KEY } }).then(r => r.json()).catch(() => ({ checkins: [] }))
      ]);
      
      const combinados = [...(resHoje.data || []), ...(resAmanha.data || [])];
      setPredicoes(combinados);
      setCheckins(resCheckin.checkins || resCheckin.data || []);
      setUltimaAtualizacao(new Date());
    } catch (err) {
      setErro('Erro ao carregar dados: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [data, modelSelecionado]);

  useEffect(() => {
    fetchDados();
    const interval = setInterval(fetchDados, 300000); 
    return () => clearInterval(interval);
  }, [fetchDados]);

  const checkinsDoDia = useMemo(() => {
    if (!checkins || !checkins.length) return [];
    return checkins
      .map(c => {
        const dtStr = c.data ? c.data.replace(' ', 'T') : '';
        const dt = new Date(dtStr);
        const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const ts = dt.getTime();
        return { ...c, hora, ts };
      })
      .sort((a, b) => a.ts - b.ts);
  }, [checkins]);

  const { dadosGrafico, modelosUnicos } = useMemo(() => {
    if (!predicoes.length && !checkinsDoDia.length) return { dadosGrafico: [], modelosUnicos: [] };

    const inicioTs = new Date(`${data}T00:00:00`).getTime();
    const fimTs = new Date(`${data}T23:59:59`).getTime();
    const modelosSet = new Set();
    
    const processados = predicoes
      .map(p => ({
        ...p,
        ts: new Date(p.inference_datetime.replace(' ', 'T')).getTime()
      }))
      .filter(p => p.ts >= inicioTs && p.ts <= fimTs);

    const grupos = {};

    processados.forEach(pred => {
      const horaLabel = new Date(pred.ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const modeloLimpo = limparNomeModelo(pred.model_name);
      modelosSet.add(modeloLimpo);
      
      if (!grupos[horaLabel]) {
        grupos[horaLabel] = { hora: horaLabel, ts: pred.ts, checkinsReais: [] };
      }
      grupos[horaLabel][modeloLimpo] = parseFloat((pred.prediction * 100).toFixed(2));
    });

    // Inserir os slots de checkin no grafico para alinhamento exato
    checkinsDoDia.forEach(chk => {
      if (chk.ts >= inicioTs && chk.ts <= fimTs) {
        if (!grupos[chk.hora]) {
          grupos[chk.hora] = { hora: chk.hora, ts: chk.ts, checkinsReais: [] };
        }
        grupos[chk.hora].checkinsReais.push(chk);
      }
    });

    const ordenados = Object.values(grupos).sort((a, b) => a.ts - b.ts);

    return { dadosGrafico: ordenados, modelosUnicos: Array.from(modelosSet) };
  }, [predicoes, data, checkinsDoDia]);

  const cores = {
    'academia_in': '#3b82f6', 'terco_in': '#ef4444', 'awake_in': '#10b981',
    'awake_out': '#f59e0b', 'EDIHB_in': '#8b5cf6', 'EDISEN_in': '#ec4899',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-8 font-sans">
      <style>{`
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-soft {
          animation: pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .checkin-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .checkin-badge-in {
          background-color: #ecfdf5;
          color: #047857;
          border-color: #a7f3d0;
        }
        .checkin-badge-out {
          background-color: #fffbeb;
          color: #b45309;
          border-color: #fde68a;
        }
      `}</style>

      <div className="dashboard-container">
        <div className="memorias-header">
          <h1>📊 Predições & Check-ins</h1>
          <button
            className="btn-primary"
            onClick={fetchDados}
            disabled={loading}
          >
            <span className={loading ? 'spinning' : ''}>🔄</span>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
        <div className="dashboard-sync-info">
          <span>Atualizado em: {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
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

            <div className="edit-field" style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                <input 
                  type="checkbox"
                  checked={exibirCheckins}
                  onChange={(e) => setExibirCheckins(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                />
                📍 Overlay Check-ins Reais ({checkinsDoDia.length})
              </label>
            </div>
          </div>
        </div>

        {/* Faixa de Check-ins Reais do Dia */}
        {checkinsDoDia.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            padding: '12px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              🚪 Check-ins Reais do Dia ({checkinsDoDia.length}):
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {checkinsDoDia.map((chk, idx) => (
                <div 
                  key={chk.id || idx}
                  className={`checkin-badge-pill ${chk.direction === 'in' ? 'checkin-badge-in' : 'checkin-badge-out'}`}
                >
                  <span>{chk.direction === 'in' ? '🟢' : '🔴'}</span>
                  <span>{chk.hora}</span>
                  <span><strong>{chk.checkin}</strong></span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>({chk.direction === 'in' ? 'Entrada' : 'Saída'})</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {erro && <div className="error-message">{erro}</div>}

        {/* Gráfico com Live Pulsante */}
        {dadosGrafico.length > 0 && (
          <div className="dashboard-chart-card">
            <div className="dashboard-chart-header">
              <h2>Probabilidade (%) vs Horário Real</h2>
              <div className="live-badge">
                <span className="live-dot"></span>
                <span>LIVE MONITOR</span>
              </div>
            </div>

            <div className="h-[380px] w-full" style={{ height: '400px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGrafico} margin={{ top: 15, right: 15, left: -20, bottom: 65 }}>
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
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '10px', paddingTop: '40px' }} />
                  
                  {/* Linhas de Predição */}
                  {modelosUnicos.map(modelo => (
                    <Line 
                      key={modelo} 
                      type="monotone" 
                      dataKey={modelo} 
                      name={modelo} 
                      stroke={cores[modelo] || '#94a3b8'} 
                      strokeWidth={2.5} 
                      dot={false} 
                      connectNulls={true} 
                    />
                  ))}

                  {/* Lines de Check-in Real */}
                  {exibirCheckins && checkinsDoDia.map((chk, idx) => (
                    <ReferenceLine 
                      key={`chk-${chk.id || idx}`}
                      x={chk.hora}
                      stroke={chk.direction === 'in' ? '#10b981' : '#f59e0b'}
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{ 
                        value: `📍 ${chk.checkin}`,
                        position: idx % 2 === 0 ? 'top' : 'insideTopLeft',
                        fill: chk.direction === 'in' ? '#047857' : '#b45309',
                        fontSize: 10,
                        fontWeight: 'bold'
                      }}
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

