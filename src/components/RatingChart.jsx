import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '../App';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function RatingChart({ contestHistory, prediction, label }) {
  const { theme } = useTheme();

  if (!contestHistory || contestHistory.length === 0) return null;

  const labels = contestHistory.map(c => {
    const title = c.contest?.title || '';
    return title.replace('Weekly Contest ', 'WC ').replace('Biweekly Contest ', 'BWC ');
  });
  const ratings = contestHistory.map(c => c.rating);

  // Add prediction point
  labels.push('Next');
  const predictedLine = [...ratings.map(() => null)];
  const upperBand = [...ratings.map(() => null)];
  const lowerBand = [...ratings.map(() => null)];

  if (ratings.length > 0 && prediction) {
    const lastIdx = ratings.length - 1;
    predictedLine[lastIdx] = ratings[lastIdx];
    upperBand[lastIdx] = ratings[lastIdx];
    lowerBand[lastIdx] = ratings[lastIdx];
    predictedLine.push(prediction.predictedRating);
    upperBand.push(prediction.upperBound);
    lowerBand.push(prediction.lowerBound);
  }

  const isDark = theme === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const tickColor = isDark ? '#5a5a72' : '#888';
  const tooltipBg = isDark ? 'rgba(18,18,30,0.95)' : 'rgba(255,255,255,0.95)';
  const tooltipTitle = isDark ? '#e8e8f0' : '#1a1a2e';
  const tooltipBody = isDark ? '#8b8ba3' : '#555';

  const lineColor = label === 'User B' ? '#5b8def' : '#ffa116';
  const fillColor = label === 'User B' ? 'rgba(91,141,239,0.15)' : 'rgba(255,161,22,0.15)';
  const predColor = label === 'User B' ? '#4070d0' : '#ff6b35';

  const data = {
    labels,
    datasets: [
      {
        label: label || 'Rating',
        data: ratings.concat([null]),
        borderColor: lineColor,
        backgroundColor: fillColor,
        borderWidth: 2.5,
        fill: true,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: lineColor,
        pointBorderColor: isDark ? '#0a0a0f' : '#fff',
        pointBorderWidth: 2,
      },
      {
        label: 'Predicted',
        data: predictedLine,
        borderColor: predColor,
        borderWidth: 2.5,
        borderDash: [8, 4],
        fill: false,
        tension: 0,
        pointRadius: predictedLine.map((_, i) => i === predictedLine.length - 1 ? 7 : 0),
        pointHoverRadius: 8,
        pointBackgroundColor: predColor,
        pointBorderColor: isDark ? '#0a0a0f' : '#fff',
        pointBorderWidth: 2,
        pointStyle: 'star',
      },
      {
        label: 'Upper Bound',
        data: upperBand,
        borderColor: `${predColor}44`,
        borderWidth: 1,
        borderDash: [4, 4],
        fill: false,
        tension: 0,
        pointRadius: 0,
      },
      {
        label: 'Lower Bound',
        data: lowerBand,
        borderColor: `${predColor}44`,
        borderWidth: 1,
        borderDash: [4, 4],
        fill: '-1',
        backgroundColor: `${predColor}12`,
        tension: 0,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: {
          color: tickColor,
          font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
          boxWidth: 12, boxHeight: 2, padding: 16,
          filter: (item) => !['Upper Bound', 'Lower Bound'].includes(item.text),
        },
      },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipTitle,
        bodyColor: tooltipBody,
        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: { family: "'Inter', sans-serif", weight: '600', size: 13 },
        bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
        displayColors: false,
        callbacks: {
          label: (ctx) => {
            if (['Upper Bound', 'Lower Bound'].includes(ctx.dataset.label)) return null;
            if (ctx.raw === null) return null;
            return `${ctx.dataset.label}: ${Math.round(ctx.raw)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: tickColor,
          font: { family: "'Inter', sans-serif", size: 10 },
          maxRotation: 45,
          maxTicksLimit: 15,
        },
      },
      y: {
        grid: { color: gridColor, drawBorder: false },
        ticks: {
          color: tickColor,
          font: { family: "'JetBrains Mono', monospace", size: 11 },
          padding: 8,
        },
        beginAtZero: false,
      },
    },
  };

  return (
    <div className="glass-card fade-in-up">
      <h3 className="section-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        Rating History & Forecast
      </h3>
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
