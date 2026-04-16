import React, { useEffect, useRef } from 'react';

export default function PredictionCard({ prediction, currentRating }) {
  const rangeFillRef = useRef(null);

  useEffect(() => {
    if (rangeFillRef.current && prediction) {
      const range = prediction.upperBound - prediction.lowerBound;
      const position = range > 0
        ? ((prediction.predictedRating - prediction.lowerBound) / range) * 100
        : 50;
      setTimeout(() => {
        rangeFillRef.current.style.width = `${Math.min(Math.max(position, 10), 90)}%`;
      }, 300);
    }
  }, [prediction]);

  if (!prediction) return null;

  const change = prediction.expectedChange;

  const trendInfo = {
    up: { icon: '↑', text: 'Rising', className: 'up' },
    down: { icon: '↓', text: 'Falling', className: 'down' },
    stable: { icon: '→', text: 'Stable', className: 'stable' },
  };

  const t = trendInfo[prediction.trend] || trendInfo.stable;

  return (
    <div className="glass-card prediction-card fade-in-up">
      <div className="prediction-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Next Contest Prediction
        </h3>
        <div className={`trend-badge ${t.className}`}>
          <span>{t.icon}</span>
          <span>{t.text}</span>
        </div>
      </div>

      <div className="prediction-body">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <span className="predicted-label">Predicted Rating</span>
          <span className="predicted-value">{prediction.predictedRating.toLocaleString()}</span>
          <div className="predicted-range">
            <span>{prediction.lowerBound}</span>
            <div className="range-bar">
              <div className="range-fill" ref={rangeFillRef}></div>
            </div>
            <span>{prediction.upperBound}</span>
          </div>
        </div>

        <div className="prediction-details">
          <div className="detail-item">
            <span className="detail-label">Expected Δ</span>
            <span className={`detail-value ${change >= 0 ? 'positive' : 'negative'}`}>
              {change >= 0 ? '+' : ''}{change}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Confidence</span>
            <span className="detail-value">{prediction.confidence}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Trend</span>
            <span className="detail-value">{prediction.trendStrength}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Avg Solved</span>
            <span className="detail-value">{prediction.avgProblemsSolved}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Solve Rate</span>
            <span className="detail-value">{prediction.avgSolveRate}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Avg Rank</span>
            <span className="detail-value">#{prediction.avgRank?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
