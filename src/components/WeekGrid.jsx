import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Converte hora decimal (ex: 8.5) para Y pixels na altura de 300px (escala de 06:00 a 24:00)
 */
function hourToY(hour) {
  const minHour = 0;
  const maxHour = 24;
  const clamped = Math.max(minHour, Math.min(maxHour, hour));
  return ((clamped - minHour) / (maxHour - minHour)) * 300;
}

export default function WeekGrid({
  weekDays,
  selectedDay,
  onSelectDay,
  arcsByDay,
  weekLabel,
  goToPreviousWeek,
  goToNextWeek,
  canGoNext
}) {
  if (!weekDays || weekDays.length === 0) return null;

  return (
    <div className="week-grid-card">
      <div className="week-grid-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="week-grid-title" style={{ margin: 0 }}>Ritmo Semanal — Continuidade IN / OUT</h3>
            
            {/* Controles de Navegação de Semana < | > */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-hover)', borderRadius: 'var(--radius-sm)', padding: '2px 6px', border: '1px solid var(--border)' }}>
              <button
                onClick={goToPreviousWeek}
                title="Semana anterior"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
              >
                <ChevronLeft size={16} />
              </button>

              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', padding: '0 4px', userSelect: 'none' }}>
                {weekLabel}
              </span>

              <button
                onClick={goToNextWeek}
                disabled={!canGoNext}
                title="Próxima semana"
                style={{ background: 'none', border: 'none', cursor: canGoNext ? 'pointer' : 'not-allowed', padding: '2px 4px', display: 'flex', alignItems: 'center', color: canGoNext ? 'var(--text-secondary)' : 'var(--text-tertiary)', opacity: canGoNext ? 1 : 0.4 }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <p className="week-grid-subtitle">
            Visualização vertical por horário (00:00 às 24:00) • Domingo a Sábado
          </p>
        </div>

        <div className="week-grid-legend">
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#3B82F6' }} />
            <span>Sono</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#F97316' }} />
            <span>Casa/Trabalho</span>
          </div>
          <div className="legend-item">
            <span className="legend-dot" style={{ backgroundColor: '#10B981' }} />
            <span>Rotina/Terço</span>
          </div>
        </div>
      </div>

      <div className="week-grid-body">
        {/* Eixo Y de Horários */}
        <div className="time-axis">
          <span>00:00</span>
          <span>04:00</span>
          <span>08:00</span>
          <span>12:00</span>
          <span>16:00</span>
          <span>20:00</span>
          <span>24:00</span>
        </div>

        {/* Container das Colunas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div className="columns-container">
            {weekDays.map((dayObj, i) => {
              const isSelected = selectedDay === dayObj.dateKey;
              const dayArcs = (arcsByDay && arcsByDay[i]) || [];

              return (
                <div
                  key={dayObj.dateKey}
                  className={`day-column ${isSelected ? 'selected' : ''} ${dayObj.isToday ? 'today' : ''}`}
                  onClick={() => onSelectDay(dayObj.dateKey)}
                >
                  <div className="day-column-header">
                    <div className="day-initial">{dayObj.initial}</div>
                    <div className="day-sub">{dayObj.short} {dayObj.dayNumber}</div>
                  </div>

                  <div className="day-track-container" style={{ position: 'relative', height: '300px', width: '100%' }}>
                    <div className="day-track" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '2px', height: '100%', backgroundColor: 'var(--border)' }} />
                    
                    {/* Ordenar arcos para que a camada mais larga (sono) fique no fundo e as mais finas por cima */}
                    {[...dayArcs]
                      .sort((a, b) => {
                        const order = { sleep: 1, commute: 2, routine: 3 };
                        return (order[a.category] || 3) - (order[b.category] || 3);
                      })
                      .map((arc) => {
                        const y1 = hourToY(arc.startHour);
                        const y2 = hourToY(arc.endHour);

                        // Estilos de espessura por categoria para visibilidade em camadas
                        let lineWidth = '3px';
                        let lineOpacity = 0.9;
                        let lineZIndex = 3;

                        if (arc.category === 'sleep') {
                          lineWidth = '10px';
                          lineOpacity = 0.35;
                          lineZIndex = 1;
                        } else if (arc.category === 'commute') {
                          lineWidth = '6px';
                          lineOpacity = 0.7;
                          lineZIndex = 2;
                        }

                        return (
                          <div key={arc.id}>
                            {arc.paired && (
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  left: '50%', 
                                  top: `${y1}px`, 
                                  height: `${y2 - y1}px`, 
                                  width: lineWidth, 
                                  backgroundColor: arc.color, 
                                  transform: 'translateX(-50%)',
                                  opacity: lineOpacity,
                                  borderRadius: '4px',
                                  zIndex: lineZIndex
                                }} 
                              />
                            )}
                            <div 
                              style={{ 
                                position: 'absolute', 
                                left: '50%', 
                                top: `${y1}px`, 
                                width: '10px', 
                                height: '10px', 
                                backgroundColor: arc.startDir === 'out' ? '#FFF' : arc.color, 
                                border: arc.startDir === 'out' ? `2px solid ${arc.color}` : 'none', 
                                borderRadius: '50%', 
                                transform: 'translate(-50%, -50%)',
                                zIndex: 5
                              }} 
                            />
                            {arc.paired && (
                              <div 
                                style={{ 
                                  position: 'absolute', 
                                  left: '50%', 
                                  top: `${y2}px`, 
                                  width: '10px', 
                                  height: '10px', 
                                  backgroundColor: arc.endDir === 'in' ? arc.color : '#FFF', 
                                  border: arc.endDir === 'in' ? 'none' : `2px solid ${arc.color}`, 
                                  borderRadius: '50%', 
                                  transform: 'translate(-50%, -50%)',
                                  zIndex: 5
                                }} 
                              />
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
