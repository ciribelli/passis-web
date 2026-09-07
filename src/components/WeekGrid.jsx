import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Converte hora decimal (ex: 8.5) para Y pixels na altura de 300px (escala de 06:00 a 24:00)
 */
function hourToY(hour) {
  const minHour = 6;
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
            Visualização vertical por horário (06:00 às 24:00) • Domingo a Sábado
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
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
          <span>15:00</span>
          <span>18:00</span>
          <span>21:00</span>
          <span>24:00</span>
        </div>

        {/* Container das Colunas e SVG Layer */}
        <div style={{ flex: 1, position: 'relative' }}>
          {/* SVG Overlay dos Arcos do Esboço */}
          <svg
            className="arcs-svg-layer"
            viewBox="0 0 700 300"
            preserveAspectRatio="none"
          >
            {weekDays.map((dayObj, i) => {
              const dayArcs = (arcsByDay && arcsByDay[i]) || [];
              const x = i * 100 + 50; // Centro da coluna i (0..600)

              return (
                <g key={dayObj.dateKey}>
                  {dayArcs.map((arc) => {
                    const y1 = hourToY(arc.startHour);
                    const y2 = hourToY(arc.endHour);

                    if (arc.paired) {
                      const curveOffset = Math.min(25, 10 + (y2 - y1) * 0.15);
                      const pathD = `M ${x} ${y1} C ${x + curveOffset} ${y1 + (y2 - y1) * 0.25}, ${x + curveOffset} ${y1 + (y2 - y1) * 0.75}, ${x} ${y2}`;

                      return (
                        <g key={arc.id}>
                          <path
                            d={pathD}
                            fill="none"
                            stroke={arc.color}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            opacity="0.85"
                          />
                          <circle
                            cx={x}
                            cy={y1}
                            r="5"
                            fill={arc.color}
                          />
                          <circle
                            cx={x}
                            cy={y2}
                            r="4.5"
                            fill="#FFFFFF"
                            stroke={arc.color}
                            strokeWidth="2.5"
                          />
                        </g>
                      );
                    }

                    return (
                      <circle
                        key={arc.id}
                        cx={x}
                        cy={y1}
                        r="5"
                        fill={arc.color}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Grid de Colunas HTML */}
          <div className="columns-container">
            {weekDays.map((dayObj) => {
              const isSelected = selectedDay === dayObj.dateKey;

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

                  <div className="day-track" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
