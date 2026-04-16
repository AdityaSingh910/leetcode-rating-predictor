import React, { useState, useEffect } from 'react';
import { fetchContests, fetchContestRanking, fetchContestHistory, fetchUserProfile } from '../api/leetcode';
import { simulateRatingChange } from '../utils/predictor';

export default function SimulatePage() {
  const [username, setUsername] = useState('');
  const [rank, setRank] = useState('');
  const [problemsSolved, setProblemsSolved] = useState('');
  const [contests, setContests] = useState([]);
  const [selectedContest, setSelectedContest] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [contestTitle, setContestTitle] = useState('');

  // Load recent contests on mount
  useEffect(() => {
    fetchContests()
      .then(data => {
        if (data.contests?.length > 0) {
          setContests(data.contests);
          setSelectedContest(data.contests[0].titleSlug);
        }
      })
      .catch(err => console.error("Failed to load contests", err));
  }, []);

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (!username || !rank || !selectedContest) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 1. Fetch user's existing history & profile in parallel
      const [historyData, profileData, rankData] = await Promise.all([
        fetchContestHistory(username.trim()),
        fetchUserProfile(username.trim()),
        fetchContestRanking(selectedContest, 1),
      ]);

      const history = historyData.contestHistory || [];
      if (history.length === 0) {
        throw new Error('User has no contest history. Simulation requires at least one past contest.');
      }

      const totalParticipants = rankData.totalParticipants;
      if (!totalParticipants) {
        throw new Error('Could not determine total participants for this contest.');
      }

      const userCurrentRating = profileData.userContestRanking?.rating || history[history.length - 1].rating;
      const contestsAttended = profileData.userContestRanking?.attendedContestsCount || history.length;
      const solved = parseInt(problemsSolved, 10) || 0;

      // 2. Run simulation with the proper Elo function
      const simResult = simulateRatingChange(
        userCurrentRating,
        parseInt(rank, 10),
        totalParticipants,
        contestsAttended,
        solved,
        4
      );

      const title = contests.find(c => c.titleSlug === selectedContest)?.title || selectedContest;
      setContestTitle(title);
      setResult(simResult);

    } catch (err) {
      setError(err.message || 'Failed to simulate. Please check the username and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-title">
        <h2>Post-Contest Simulator</h2>
        <p>Predict your new rating immediately after a contest finishes</p>
      </div>

      <div className="glass-card sim-form-card">
        <form onSubmit={handleSimulate} className="sim-form">
          <div className="sim-form-grid">
            <div className="sim-field">
              <label className="sim-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Username
              </label>
              <input 
                type="text" 
                className="sim-input" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="e.g. adityasingh22"
                required 
              />
            </div>

            <div className="sim-field">
              <label className="sim-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                Contest
              </label>
              <div className="sim-select-wrapper">
                <select 
                  className="sim-input sim-select" 
                  value={selectedContest} 
                  onChange={e => setSelectedContest(e.target.value)}
                  required
                >
                  {contests.map(c => (
                    <option key={c.titleSlug} value={c.titleSlug}>
                      {c.title}
                    </option>
                  ))}
                </select>
                <svg className="sim-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            <div className="sim-field">
              <label className="sim-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="20" x2="12" y2="10"/>
                  <line x1="18" y1="20" x2="18" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="16"/>
                </svg>
                Your Rank
              </label>
              <input 
                type="number" 
                className="sim-input" 
                value={rank} 
                onChange={e => setRank(e.target.value)} 
                placeholder="e.g. 15951"
                min="1"
                required 
              />
            </div>

            <div className="sim-field">
              <label className="sim-label">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 11 12 14 22 4"/>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                </svg>
                Problems Solved
              </label>
              <div className="sim-problems-row">
                {[0, 1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    type="button"
                    className={`sim-problem-btn ${parseInt(problemsSolved) === n ? 'active' : ''}`}
                    onClick={() => setProblemsSolved(String(n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="sim-submit-btn" disabled={loading || !problemsSolved}>
            {loading ? (
              <>
                <span className="sim-spinner"></span>
                Simulating...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Simulate Rating
              </>
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="sim-error fade-in-up">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="sim-result-container fade-in-up">
          {/* Contest Title */}
          <div className="sim-contest-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15l-2 5l9-11h-5l2-5l-9 11h5z"/>
            </svg>
            {contestTitle}
          </div>

          {/* Main Result Card */}
          <div className={`glass-card sim-result-card ${result.delta >= 0 ? 'sim-positive' : 'sim-negative'}`}>
            <div className="sim-result-hero">
              <div className="sim-rating-flow">
                <div className="sim-rating-box">
                  <span className="sim-rating-label">Current</span>
                  <span className="sim-rating-num">{result.currentRating.toLocaleString()}</span>
                </div>
                <div className="sim-arrow">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </div>
                <div className="sim-rating-box sim-rating-new">
                  <span className="sim-rating-label">New Rating</span>
                  <span className="sim-rating-num highlight">{result.newRating.toLocaleString()}</span>
                </div>
              </div>

              <div className={`sim-delta-display ${result.delta >= 0 ? 'positive' : 'negative'}`}>
                <span className="sim-delta-value">
                  {result.delta >= 0 ? '+' : ''}{result.delta}
                </span>
                <span className="sim-delta-label">Rating Change</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="sim-stats-grid">
              <div className="sim-stat">
                <span className="sim-stat-icon">🎯</span>
                <div>
                  <span className="sim-stat-value">#{result.actualRank.toLocaleString()}</span>
                  <span className="sim-stat-label">Your Rank</span>
                </div>
              </div>
              <div className="sim-stat">
                <span className="sim-stat-icon">📊</span>
                <div>
                  <span className="sim-stat-value">#{result.expectedRank.toLocaleString()}</span>
                  <span className="sim-stat-label">Expected Rank</span>
                </div>
              </div>
              <div className="sim-stat">
                <span className="sim-stat-icon">⚡</span>
                <div>
                  <span className="sim-stat-value">{result.performanceRating.toLocaleString()}</span>
                  <span className="sim-stat-label">Perf. Rating</span>
                </div>
              </div>
              <div className="sim-stat">
                <span className="sim-stat-icon">👥</span>
                <div>
                  <span className="sim-stat-value">{result.totalParticipants.toLocaleString()}</span>
                  <span className="sim-stat-label">Participants</span>
                </div>
              </div>
              <div className="sim-stat">
                <span className="sim-stat-icon">✅</span>
                <div>
                  <span className="sim-stat-value">{result.problemsSolved}/{result.totalProblems}</span>
                  <span className="sim-stat-label">Solved</span>
                </div>
              </div>
              <div className="sim-stat">
                <span className="sim-stat-icon">🏆</span>
                <div>
                  <span className="sim-stat-value">Top {result.percentile}%</span>
                  <span className="sim-stat-label">Percentile</span>
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div className={`sim-interpretation ${result.delta >= 0 ? 'positive' : 'negative'}`}>
              <div className="sim-interp-icon">
                {result.delta >= 0 ? '📈' : '📉'}
              </div>
              <div className="sim-interp-text">
                {result.delta >= 0 ? (
                  <p>You performed <strong>better than expected</strong>. Your actual rank ({result.actualRank.toLocaleString()}) was higher than your expected rank ({result.expectedRank.toLocaleString()}).</p>
                ) : (
                  <p>You performed <strong>below expectations</strong>. Your actual rank ({result.actualRank.toLocaleString()}) was lower than your expected rank ({result.expectedRank.toLocaleString()}).</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
