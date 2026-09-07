import React from 'react';

export default function DayTimeline({ selectedDay, checkins }) {
  const formattedDate = selectedDay
    ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    : '';

  return (
    <div className="day-timeline-card">
      <div className="day-timeline-header">
        <h3 className="day-timeline-title">
          Timeline do Dia — <span style={{ textTransform: 'capitalize' }}>{formattedDate}</span>
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
          {checkins.length} {checkins.length === 1 ? 'check-in' : 'check-ins'}
        </span>
      </div>

      {checkins.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
          Nenhum check-in registrado neste dia.
        </div>
      ) : (
        <div className="day-timeline-list">
          {checkins.map((item) => {
            const time = item.data ? item.data.split(' ')[1].slice(0, 5) : '--:--';
            const isDirIn = item.direction === 'in';

            return (
              <div key={item.id} className="timeline-item">
                <div className="timeline-time">{time}</div>
                <div className="timeline-name">{item.checkin}</div>
                <span className={`timeline-badge ${isDirIn ? 'in' : 'out'}`}>
                  {isDirIn ? 'Entrada' : 'Saída'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
