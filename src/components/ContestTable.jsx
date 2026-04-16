import React from 'react';

export default function ContestTable({ contestHistory }) {
  if (!contestHistory || contestHistory.length === 0) return null;

  // Show last 15, newest first
  const recent = [...contestHistory].reverse().slice(0, 15);

  return (
    <div className="glass-card fade-in-up">
      <h3 className="section-header">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="3" y1="9" x2="21" y2="9" />
          <line x1="9" y1="21" x2="9" y2="9" />
        </svg>
        Recent Contests
      </h3>
      <div className="table-wrapper">
        <table className="contest-table">
          <thead>
            <tr>
              <th>Contest</th>
              <th>Rank</th>
              <th>Rating</th>
              <th>Δ Rating</th>
              <th>Solved</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((contest, idx) => {
              const rating = Math.round(contest.rating);
              const allReversed = [...contestHistory].reverse();
              const globalIdx = allReversed.indexOf(contest);

              let delta = '—';
              let deltaClass = '';
              if (globalIdx < allReversed.length - 1) {
                const prevRating = Math.round(allReversed[globalIdx + 1].rating);
                const diff = rating - prevRating;
                delta = (diff >= 0 ? '+' : '') + diff;
                deltaClass = diff >= 0 ? 'delta-positive' : 'delta-negative';
              }

              return (
                <tr key={idx}>
                  <td className="contest-name">{contest.contest?.title || 'Contest'}</td>
                  <td>{contest.ranking?.toLocaleString()}</td>
                  <td>{rating}</td>
                  <td className={deltaClass}>{delta}</td>
                  <td>{contest.problemsSolved}/{contest.totalProblems}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
