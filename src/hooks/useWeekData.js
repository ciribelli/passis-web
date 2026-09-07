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
  const [weekOffset, setWeekOffset] = useState(0); // 0 = Semana Atual, -1 = Anterior, etc.
  const [weekDays, setWeekDays] = useState([]);
  const [selectedDay, setSelectedDay] = useState(formatDateKey(new Date()));
  const [allCheckins, setAllCheckins] = useState([]);
  const [habits, setHabits] = useState({});
  const [arcsByDay, setArcsByDay] = useState({});
  const [overallScore, setOverallScore] = useState(0);
  const [contextSentence, setContextSentence] = useState('');
  const [weekLabel, setWeekLabel] = useState('Semana Atual');

  useEffect(() => {
    fetchData();
  }, [weekOffset]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Hoje e Domingo Atual
      const today = new Date();
      const currentSunday = getSunday(today);

      // Domingo da semana visualizada (offset * 7 dias)
      const viewSunday = new Date(currentSunday);
      viewSunday.setDate(viewSunday.getDate() + (weekOffset * 7));

      // Sábado da semana visualizada
      const viewSaturday = new Date(viewSunday);
      viewSaturday.setDate(viewSaturday.getDate() + 6);

      // Buscar histórico estendido (8 semanas atrás do viewSunday para médias precisas)
      const startSunday = new Date(viewSunday);
      startSunday.setDate(startSunday.getDate() - 28);

      const startStr = formatDateKey(startSunday);

      const response = await axios.get(`${API_BASE_URL}/checkin`, {
        params: { start_date: startStr, limit: 500 }
      });

      const checkins = response.data.checkins || [];
      setAllCheckins(checkins);

      // 1. Gerar os 7 dias da semana visualizada (Domingo a Sábado)
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
        const d = new Date(viewSunday);
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

      // Garantir que a data selecionada pertence a essa semana se a anterior não pertence
      const dayKeys = new Set(days.map(d => d.dateKey));
      if (!dayKeys.has(selectedDay)) {
        // Se a semana contém hoje, seleciona hoje. Senão, seleciona o primeiro dia (Domingo)
        if (dayKeys.has(formatDateKey(today))) {
          setSelectedDay(formatDateKey(today));
        } else {
          setSelectedDay(days[0].dateKey);
        }
      }

      // Rótulo da semana
      if (weekOffset === 0) {
        setWeekLabel('Semana Atual');
      } else if (weekOffset === -1) {
        setWeekLabel('Semana Anterior');
      } else {
        const fmtStart = `${viewSunday.getDate()}/${viewSunday.getMonth() + 1}`;
        const fmtEnd = `${viewSaturday.getDate()}/${viewSaturday.getMonth() + 1}`;
        setWeekLabel(`${fmtStart} - ${fmtEnd}`);
      }

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
        dayCheckins.sort((a, b) => new Date(a.data) - new Date(b.data));

        const dayArcs = [];
        const pairedIds = new Set();

        const getCategory = (checkinName) => {
          const n = checkinName.toLowerCase();
          if (n.includes('awake')) return 'sleep';
          if (n.includes('casa') || n.includes('edisen') || n.includes('edihb') || n.includes('cenpes') || n.includes('drive')) return 'commute';
          return 'routine';
        };

        for (let i = 0; i < dayCheckins.length; i++) {
          const item = dayCheckins[i];
          if (pairedIds.has(item.id)) continue;

          const itemHour = parseDecimalHour(item.data);
          const name = item.checkin.toLowerCase();
          const dir = item.direction ? item.direction.toLowerCase() : '';
          const category = getCategory(name);
          const color = category === 'sleep' ? '#3B82F6' : category === 'commute' ? '#F97316' : '#10B981';

          let paired = false;

          // Procurar o par correto no mesmo dia
          for (let j = i + 1; j < dayCheckins.length; j++) {
            const nextItem = dayCheckins[j];
            if (pairedIds.has(nextItem.id)) continue;

            const nextName = nextItem.checkin.toLowerCase();
            const nextDir = nextItem.direction ? nextItem.direction.toLowerCase() : '';
            const nextCategory = getCategory(nextName);

            // Regra: Apenas mesmo nome e direções opostas (ex: casa OUT -> casa IN, awake IN -> awake OUT)
            const isSameNamePair = (name === nextName) && (dir !== nextDir);

            if (isSameNamePair) {
              const nextHour = parseDecimalHour(nextItem.data);
              const diffHours = (new Date(nextItem.data) - new Date(item.data)) / (1000 * 60 * 60);

              const startH = Math.min(itemHour, nextHour);
              const endH = Math.max(itemHour, nextHour);
              const startDir = itemHour <= nextHour ? dir : nextDir;
              const endDir = itemHour <= nextHour ? nextDir : dir;

              dayArcs.push({
                id: `arc-${item.id}-${nextItem.id}`,
                category,
                color,
                name: item.checkin,
                startHour: startH,
                endHour: endH,
                startDir,
                endDir,
                startTime: (itemHour <= nextHour ? item : nextItem).data.split(' ')[1].slice(0, 5),
                endTime: (itemHour <= nextHour ? nextItem : item).data.split(' ')[1].slice(0, 5),
                durationHours: Math.abs(diffHours).toFixed(1),
                paired: true
              });

              pairedIds.add(item.id);
              pairedIds.add(nextItem.id);
              paired = true;
              break;
            }
          }

          if (!paired && !pairedIds.has(item.id)) {
            dayArcs.push({
              id: `dot-${item.id}`,
              category,
              color,
              name: item.checkin,
              startHour: itemHour,
              endHour: itemHour + 0.3,
              startDir: dir,
              endDir: dir,
              startTime: item.data.split(' ')[1].slice(0, 5),
              paired: false
            });
            pairedIds.add(item.id);
          }
        }

        arcs[dayObj.dayIndex] = dayArcs;
      });
      setArcsByDay(arcs);

      // 4. Calcular Metas Relativas e Cards Dinâmicos por Semana
      const currentWeekKeys = new Set(days.map(d => d.dateKey));

      let currentAcademia = 0;
      let currentTerco = 0;

      days.forEach(d => {
        const list = checkinsByDate[d.dateKey] || [];
        list.forEach(c => {
          const name = c.checkin.toLowerCase();
          if (name.includes('academia')) currentAcademia++;
          if (name.includes('terco') || name.includes('terço')) currentTerco++;
        });
      });

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

      const avgAcademia = Math.max(1, Math.round(pastAcademiaCount / 4));
      const avgTerco = Math.max(1, Math.round(pastTercoCount / 4));

      const ratioAcademia = Math.min(currentAcademia / avgAcademia, 1.2);
      const ratioTerco = Math.min(currentTerco / avgTerco, 1.2);

      const scoreValue = Math.min(100, Math.round(((ratioAcademia * 0.5) + (ratioTerco * 0.5)) * 100));
      setOverallScore(scoreValue);

      let sentence = 'Consistente com seu padrão habitual';
      if (scoreValue >= 95) sentence = 'Acima do seu ritmo habitual 🔥';
      else if (scoreValue >= 80) sentence = 'Excelente ritmo esta semana 🚀';
      else if (scoreValue < 65) sentence = 'Um pouco abaixo da sua média semanal — ainda dá tempo!';

      setContextSentence(sentence);

      // Calcular Sono e Deslocamento dinamicamente por semana
      let currentSleepTotalHours = 0;
      let daysWithSleepData = 0;

      let currentCommuteTotalHours = 0;
      let daysWithCommuteData = 0;

      days.forEach(d => {
        const list = checkinsByDate[d.dateKey] || [];
        const dayArcsList = arcs[d.dayIndex] || [];

        const awakeArc = dayArcsList.find(a => a.category === 'sleep' && a.paired);
        if (awakeArc) {
          const awakeHours = parseFloat(awakeArc.durationHours);
          const sleepHours = Math.max(4, Math.min(12, 24 - awakeHours));
          currentSleepTotalHours += sleepHours;
          daysWithSleepData++;
        } else {
          const hasAwake = list.some(c => c.checkin.toLowerCase().includes('awake'));
          if (hasAwake) {
            currentSleepTotalHours += 7.5;
            daysWithSleepData++;
          }
        }

        const commuteArcs = dayArcsList.filter(a => a.category === 'commute' && a.paired);
        if (commuteArcs.length > 0) {
          let dayCommute = 0;
          commuteArcs.forEach(a => {
            dayCommute += parseFloat(a.durationHours);
          });
          currentCommuteTotalHours += dayCommute;
          daysWithCommuteData++;
        } else {
          const hasCasa = list.some(c => c.checkin.toLowerCase().includes('casa'));
          if (hasCasa) {
            currentCommuteTotalHours += 0.8;
            daysWithCommuteData++;
          }
        }
      });

      const avgCurrentSleep = daysWithSleepData > 0 ? (currentSleepTotalHours / daysWithSleepData).toFixed(1) : '7.0';
      const avgCurrentCommuteHours = daysWithCommuteData > 0 ? (currentCommuteTotalHours / daysWithCommuteData) : 0.8;
      const avgCurrentCommuteMins = Math.round(avgCurrentCommuteHours * 60);

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
          current: `${avgCurrentSleep}h`,
          target: '7.0h',
          unit: '',
          dots: days.map(d => (checkinsByDate[d.dateKey] || []).some(c => c.checkin.toLowerCase().includes('awake'))),
          trend: parseFloat(avgCurrentSleep) >= 7.0 ? '→ saudável' : '↓ abaixo',
          status: parseFloat(avgCurrentSleep) >= 7.0 ? 'above' : 'below'
        },
        transito: {
          title: 'Deslocamento',
          current: `${avgCurrentCommuteMins}m`,
          target: '50m',
          unit: '',
          dots: days.map(d => (checkinsByDate[d.dateKey] || []).some(c => c.checkin.toLowerCase().includes('casa') || c.checkin.toLowerCase().includes('edisen'))),
          trend: avgCurrentCommuteMins <= 50 ? '↓ menor' : '↑ maior',
          status: avgCurrentCommuteMins <= 50 ? 'above' : 'below'
        }
      });

    } catch (err) {
      console.error('Erro ao buscar dados no useWeekData:', err);
      setError('Não foi possível carregar o histórico de check-ins.');
    } finally {
      setLoading(false);
    }
  };

  const goToPreviousWeek = () => setWeekOffset(prev => prev - 1);
  const goToNextWeek = () => setWeekOffset(prev => Math.min(0, prev + 1));

  const selectedDayCheckins = allCheckins.filter(c => c.data && c.data.startsWith(selectedDay));

  return {
    loading,
    error,
    weekOffset,
    weekLabel,
    goToPreviousWeek,
    goToNextWeek,
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
