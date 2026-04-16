import React, { useState, useEffect } from 'react';
import LoadingSpinner, { ErrorMessage } from '../components/LoadingSpinner';
import { fetchContests, fetchContestRanking } from '../api/leetcode';

export default function Leaderboard() {
  const [contests, setContests] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');
  const [ranking, setRanking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingContests, setLoadingContests] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // Load contests list on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchContests();
        setContests(data.contests || []);
        if (data.contests?.length > 0) {
          setSelectedSlug(data.contests[0].titleSlug);
        }
      } catch (err) {
        setError('Failed to load contests list');
      } finally {
        setLoadingContests(false);
      }
    })();
  }, []);

  // Load ranking when contest or page changes
  useEffect(() => {
    if (!selectedSlug) return;
    loadRanking();
  }, [selectedSlug, page]);

  const loadRanking = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchContestRanking(selectedSlug, page);
      setRanking(data);
    } catch (err) {
      setError('Failed to load contest ranking. The contest data may not be available yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleContestChange = (e) => {
    setSelectedSlug(e.target.value);
    setPage(1);
  };

  const formatTime = (timeVal) => {
    if (!timeVal) return '—';
    // REST API returns Unix timestamp; if value > 100000 it's a timestamp, not elapsed seconds
    let seconds = timeVal;
    if (seconds > 100000) {
      // Convert to elapsed time relative to contest (approximate: show as-is with H:M:S)
      // The API returns absolute finish time; we approximate elapsed as finish_time mod 5400 (1.5h)
      seconds = seconds % 5400;
    }
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  return (
    <>
      <div className="page-title">
        <h2>Contest Leaderboard</h2>
        <p>View top performers from recent LeetCode contests</p>
      </div>

      {loadingContests ? (
        <LoadingSpinner text="Loading contests..." />
      ) : (
        <>
          <div className="leaderboard-controls">
            <select
              className="leaderboard-select"
              value={selectedSlug}
              onChange={handleContestChange}
            >
              {contests.map((c) => (
                <option key={c.titleSlug} value={c.titleSlug}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          {loading && <LoadingSpinner text="Loading rankings..." />}
          {error && <ErrorMessage message={error} />}

          {ranking && !loading && (
            <div className="glass-card fade-in-up">
              <h3 className="section-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 15l-2 5l9-11h-5l2-5l-9 11h5z" />
                </svg>
                Top Performers
                <span style={{ fontWeight: 400, fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                  {ranking.totalParticipants?.toLocaleString()} participants
                </span>
              </h3>

              <div className="table-wrapper">
                <table className="contest-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Username</th>
                      <th>Score</th>
                      <th>Finish Time</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.userRankings?.map((user, idx) => (
                      <tr key={idx}>
                        <td>
                          {user.ranking <= 3 ? (
                            <span className={`rank-badge rank-${user.ranking}`}>{user.ranking}</span>
                          ) : (
                            user.ranking
                          )}
                        </td>
                        <td className="contest-name" style={{ fontFamily: "'Inter', sans-serif" }}>
                          {user.username}
                        </td>
                        <td>{user.score}</td>
                        <td>{formatTime(user.finishTimeInSeconds)}</td>
                        <td>{user.currentRating ? Math.round(user.currentRating) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
                <button
                  className="search-btn"
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <span style={{
                  display: 'flex', alignItems: 'center',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.9rem', color: 'var(--text-secondary)'
                }}>
                  Page {page}
                </span>
                <button
                  className="search-btn"
                  style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                  onClick={() => setPage(p => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
