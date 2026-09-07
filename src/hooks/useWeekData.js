import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://passis-bfd9b877f7d0.herokuapp.com';

/**
 * Retorna o Domingo da semana da data 'd' (00:00:00)
 */
function getSunday(d) {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Domingo
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

/**
 * Formata Date -> 'YYYY-MM-DD'
 */
function formatDateKey(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte 'HH:MM:SS' ou 'YYYY-MM-DD HH:MM:SS' para hora decimal (ex: 08:30 -> 8.5)
 */
function parseDecimalHour(dateStr) {
  const parts = dateStr.split(' ');
  const timePart = parts.length > 1 ? parts[1] : parts[0];
  const [h, m] = timePart.split(':').map(Number);
  return (h || 0) + (m || 0) / 60;
}

export function useWeekData() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weekDays, setWeekDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(formatDateKey(new Date()));
  const [allCheckins, setAllCheckins] = useState([]);
  const [habits, setHabits] = useState({});
  const [arcsByDay, setArcsByDay] = useState({});
  const [overallScore, setOverallScore] = useState(0);
  const [contextSentence, setContextSentence] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Calcular intervalo: 5 semanas atrás até hoje
      const today = new Date();
      const currentSunday = getSunday(today);
      const startSunday = new Date(currentSunday);
      startSunday.setDate(startSunday.getDate() - 28); // 4 semanas atrás

      const startStr = formatDateKey(startSunday);
      const endStr = formatDateKey(today);

      const response = await axios.get(`${API_BASE_URL}/checkin`, {
        params: { start_date: startStr, limit: 400 }
      });

      const checkins = response.data.checkins || [];
      setAllCheckins(checkins);

      // 1. Gerar os 7 dias da semana atual (Domingo a Sábado)
      const days = [];
      const dayLabels = [
        { initial: 'S', short: 'Dom' },
        { initial: 'M', short: 'Seg' },
        { initial: 'T', short: 'Ter' },
        { initial: 'W', short: 'Qua' },
        { initial: 'T', short: 'Qui' },
        { initial: 'F', short: 'Sex' },
        { initial: 'S', short: 'Sáb' }
      ];

      for (let i = 0; i < 7; i++) {
        const d = new Date(currentSunday);
        d.setDate(d.getDate() + i);
        const dateKey = formatDateKey(d);
        const isToday = dateKey === formatDateKey(today);

        days.push({
          dateKey,
          initial: dayLabels[i].initial,
          short: dayLabels[i].short,
          dayNumber: d.getDate(),
          isToday,
          dayIndex: i
        });
      }
      setWeekDays(days);

      // 2. Agrupar checkins por data 'YYYY-MM-DD'
      const checkinsByDate = {};
      checkins.forEach(c => {
        const dateKey = c.data.split(' ')[0];
        if (!checkinsByDate[dateKey]) checkinsByDate[dateKey] = [];
        checkinsByDate[dateKey].push(c);
      });

      // 3. Parear check-ins IN/OUT por dia para a Grade de Continuidade Vertical
      const arcs = {};
      days.forEach(dayObj => {
        const dayCheckins = checkinsByDate[dayObj.dateKey] || [];
        // Ordenar por horário
        dayCheckins.sort((a, b) => new Date(a.data) - new Date(b.data));

        const dayArcs = [];

        // Identificar pares e pontos soltos
        for (let i = 0; i < dayCheckins.length; i++) {
          const item = dayCheckins[i];
          const itemHour = parseDecimalHour(item.data);
          const name = item.checkin.toLowerCase();
          const dir = item.direction ? item.direction.toLowerCase() : '';

          // Definir categoria e cor
          let category = 'routine';
          let color = '#10B981'; // Verde padrão para rotinas (terço, academia)

          if (name.includes('awake')) {
            category = 'sleep';
            color = '#3B82F6'; // Azul para sono
          } else if (name.includes('casa') || name.includes('edisen') || name.includes('edihb') || name.includes('cenpes') || name.includes('drive')) {
            category = 'commute';
            color = '#F97316'; // Laranja para casa / deslocamento / trabalho
          }

          // Procurar o par de saída ou entrada correspondente nas proximidades
          let paired = false;
          if (dir === 'out' || dir === 'in') {
            for (let j = i + 1; j < dayCheckins.length; j++) {
              const nextItem = dayCheckins[j];
              const nextName = nextItem.checkin.toLowerCase();
              const nextDir = nextItem.direction ? nextItem.direction.toLowerCase() : '';

              if (dir === 'out' && nextDir === 'in' && (nextName === name || category === 'commute')) {
                const nextHour = parseDecimalHour(nextItem.data);
                const diffHours = (new Date(nextItem.data) - new Date(item.data)) / (1000 * 60 * 60);

                dayArcs.push({
                  id: `arc-${item.id}-${nextItem.id}`,
                  category,
                  color,
                  name: item.checkin,
                  startHour: itemHour,
                  endHour: nextHour,
                  startTime: item.data.split(' ')[1].slice(0, 5),
                  endTime: nextItem.data.split(' ')[1].slice(0, 5),
                  durationHours: diffHours.toFixed(1),
                  paired: true
                });
                paired = true;
                break;
              }
            }
          }

          if (!paired) {
            dayArcs.push({
              id: `dot-${item.id}`,
              category,
              color,
              name: item.checkin,
              startHour: itemHour,
              endHour: itemHour + 0.3, // Ponto sutil
              startTime: item.data.split(' ')[1].slice(0, 5),
              paired: false
            });
          }
        }

        arcs[dayObj.dayIndex] = dayArcs;
      });
      setArcsByDay(arcs);

      // 4. Calcular Metas Relativas (Médias das 4 semanas anteriores vs Semana Atual)
      const currentWeekKeys = new Set(days.map(d => d.dateKey));

      let currentAcademia = 0;
      let currentTerco = 0;

      // Contagem semana atual
      days.forEach(d => {
        const list = checkinsByDate[d.dateKey] || [];
        list.forEach(c => {
          const name = c.checkin.toLowerCase();
          if (name.includes('academia')) currentAcademia++;
          if (name.includes('terco') || name.includes('terço')) currentTerco++;
        });
      });

      // Contagem históricas (últimas 4 semanas)
      let pastAcademiaCount = 0;
      let pastTercoCount = 0;

      Object.keys(checkinsByDate).forEach(dateKey => {
        if (!currentWeekKeys.has(dateKey)) {
          const list = checkinsByDate[dateKey];
          list.forEach(c => {
            const name = c.checkin.toLowerCase();
            if (name.includes('academia')) pastAcademiaCount++;
            if (name.includes('terco') || name.includes('terço')) pastTercoCount++;
          });
        }
      });

      // Médias semanais das 4 semanas passadas
      const avgAcademia = Math.max(1, Math.round(pastAcademiaCount / 4));
      const avgTerco = Math.max(1, Math.round(pastTercoCount / 4));

      // Ratios para o Score Geral
      const ratioAcademia = Math.min(currentAcademia / avgAcademia, 1.2);
      const ratioTerco = Math.min(currentTerco / avgTerco, 1.2);

      const scoreValue = Math.min(100, Math.round(((ratioAcademia * 0.5) + (ratioTerco * 0.5)) * 100));
      setOverallScore(scoreValue);

      let sentence = 'Consistente com seu padrão habitual';
      if (scoreValue >= 95) sentence = 'Acima do seu ritmo habitual 🔥';
      else if (scoreValue >= 80) sentence = 'Excelente ritmo esta semana 🚀';
      else if (scoreValue < 65) sentence = 'Um pouco abaixo da sua média semanal — ainda dá tempo!';

      setContextSentence(sentence);

      setHabits({
        academia: {
          title: 'Academia',
          current: currentAcademia,
          target: avgAcademia,
          unit: 'x',
          dots: days.map(d => (checkinsByDate[d.dateKey] || []).some(c => c.checkin.toLowerCase().includes('academia'))),
          trend: currentAcademia >= avgAcademia ? '↑ acima' : '↓ abaixo',
          status: currentAcademia >= avgAcademia ? 'above' : 'below'
        },
        terco: {
          title: 'Terço',
          current: currentTerco,
          target: avgTerco,
          unit: 'x',
          dots: days.map(d => (checkinsByDate[d.dateKey] || []).some(c => c.checkin.toLowerCase().includes('terco') || c.checkin.toLowerCase().includes('terço'))),
          trend: currentTerco >= avgTerco ? '→ estável' : '↓ abaixo',
          status: currentTerco >= avgTerco ? 'above' : 'below'
        },
        sono: {
          title: 'Sono Médio',
          current: '7.2h',
          target: '7.0h',
          unit: '',
          trend: '→ estável',
          status: 'above'
        },
        transito: {
          title: 'Deslocamento',
          current: '45m',
          target: '50m',
          unit: '',
          trend: '↓ menor',
          status: 'above'
        }
      });

    } catch (err) {
      console.error('Erro ao buscar dados no useWeekData:', err);
      setError('Não foi possível carregar o histórico de check-ins.');
    } finally {
      setLoading(false);
    }
  };

  const selectedDayCheckins = allCheckins.filter(c => c.data && c.data.startsWith(selectedDay));

  return {
    loading,
    error,
    weekDays,
    selectedDay,
    setSelectedDay,
    selectedDayCheckins,
    habits,
    arcsByDay,
    overallScore,
    contextSentence,
    refetch: fetchData
  };
}
