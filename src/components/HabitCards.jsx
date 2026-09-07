import React from 'react';

export default function HabitCards({ habits }) {
  if (!habits || Object.keys(habits).length === 0) return null;

  const cardKeys = ['academia', 'terco', 'sono', 'transito'];

  return (
    <div className="habit-cards-grid">
      {cardKeys.map(key => {
        const item = habits[key];
        if (!item) return null;

        return (
          <div className="habit-card" key={key}>
            <div className="habit-card-header">
              <span className="habit-card-title">{item.title}</span>
              <span className={`habit-card-badge ${item.status}`}>
                {item.trend}
              </span>
            </div>

            <div className="habit-card-main">
              <span className="habit-card-value">{item.current}</span>
              {item.target && (
                <span className="habit-card-target">
                  / {item.target}{item.unit}
                </span>
              )}
            </div>

            {item.dots && (
              <div className="habit-card-dots">
                {item.dots.map((active, i) => (
                  <span
                    key={i}
                    className={`habit-dot ${active ? 'active' : ''}`}
                    title={`Dia ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
