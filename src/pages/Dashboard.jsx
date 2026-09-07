import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useWeekData } from '../hooks/useWeekData';
import WeekScore from '../components/WeekScore';
import HabitCards from '../components/HabitCards';
import WeekGrid from '../components/WeekGrid';
import DayTimeline from '../components/DayTimeline';
import '../styles/dashboard-v2.css';

export default function Dashboard() {
  const {
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
    refetch
  } = useWeekData();

  if (loading) {
    return (
      <div className="dashboard-v2-container" style={{ textAlign: 'center', paddingTop: '80px', color: 'var(--text-tertiary)' }}>
        <RefreshCw size={24} className="spinning" style={{ marginBottom: '12px' }} />
        <div>Carregando ritmo da semana...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-v2-container" style={{ textAlign: 'center', paddingTop: '60px', color: 'var(--neg)' }}>
        <div>{error}</div>
        <button onClick={refetch} style={{ marginTop: '12px', padding: '8px 16px', cursor: 'pointer' }}>
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="dashboard-v2-container">
      {/* Cabeçalho */}
      <div className="dashboard-v2-header">
        <div className="dashboard-v2-title">
          <h1>Semana Ótima</h1>
          <p>Acompanhamento de ritmo, hábitos e continuidade vertical</p>
        </div>

        <Link to="/predicoes" className="predicoes-link-btn">
          <Sparkles size={16} />
          <span>Ver Predições</span>
        </Link>
      </div>

      {/* Hero: Progresso Relativo */}
      <WeekScore score={overallScore} sentence={contextSentence} />

      {/* Cards de Hábitos Mínimos */}
      <HabitCards habits={habits} />

      {/* O Seu Esboço: Grade Semanal de Continuidade Vertical */}
      <WeekGrid
        weekDays={weekDays}
        selectedDay={selectedDay}
        onSelectDay={setSelectedDay}
        arcsByDay={arcsByDay}
        weekLabel={weekLabel}
        goToPreviousWeek={goToPreviousWeek}
        goToNextWeek={goToNextWeek}
        canGoNext={weekOffset < 0}
      />

      {/* Timeline Detalhada do Dia Selecionado */}
      <DayTimeline
        selectedDay={selectedDay}
        checkins={selectedDayCheckins}
      />
    </div>
  );
}
