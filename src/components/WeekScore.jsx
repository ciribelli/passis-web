import React from 'react';

export default function WeekScore({ score, sentence }) {
  return (
    <div className="week-score-section">
      <div className="week-score-header">
        <span className="week-score-label">Ritmo Geral da Semana</span>
        <span className="week-score-value">{score}%</span>
      </div>
      <div className="week-score-track">
        <div className="week-score-fill" style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
      <div className="week-score-sentence">{sentence}</div>
    </div>
  );
}
