import React from 'react';

/**
 * Converte hora decimal (ex: 8.5) para Y pixels na altura de 300px (escala de 06:00 a 24:00)
 */
function hourToY(hour) {
  const minHour = 6;
  const maxHour = 24;
  const clamped = Math.max(minHour, Math.min(maxHour, hour));
  return ((clamped - minHour) / (maxHour - minHour)) * 300;
}

export default function WeekGrid({ weekDays, selectedDay, onSelectDay, arcsByDay }) {
  if (!weekDays || weekDays.length === 0) return null;

  return (
    <div className="week-grid-card">
      <div className="week-grid-header">
        <div>
          <h3 className="week-grid-title">Ritmo Semanal — Continuidade IN / OUT</h3>
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
                      // Curva suave tipo esboço conectando IN e OUT
                      const curveOffset = Math.min(25, 10 + (y2 - y1) * 0.15);
                      const pathD = `M ${x} ${y1} C ${x + curveOffset} ${y1 + (y2 - y1) * 0.25}, ${x + curveOffset} ${y1 + (y2 - y1) * 0.75}, ${x} ${y2}`;

                      return (
                        <g key={arc.id}>
                          {/* Arco curvo */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke={arc.color}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            opacity="0.85"
                          />
                          {/* Ponto IN (Preenchido) */}
                          <circle
                            cx={x}
                            cy={y1}
                            r="5"
                            fill={arc.color}
                          />
                          {/* Ponto OUT (Anel/Outline) */}
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

                    // Ponto solto sem par
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

                  {/* Linha vertical centralizada da coluna */}
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
