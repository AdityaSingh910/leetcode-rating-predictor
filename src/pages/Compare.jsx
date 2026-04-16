import React, { useState } from 'react';
import ProfileCard from '../components/ProfileCard';
import PredictionCard from '../components/PredictionCard';
import RatingChart from '../components/RatingChart';
import LoadingSpinner, { ErrorMessage } from '../components/LoadingSpinner';
import { fetchUserProfile, fetchContestHistory } from '../api/leetcode';
import { predictRating } from '../utils/predictor';

export default function Compare() {
  const [userA, setUserA] = useState('');
  const [userB, setUserB] = useState('');
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCompare = async (e) => {
    e.preventDefault();
    const a = userA.trim();
    const b = userB.trim();
    if (!a || !b || loading) return;

    setLoading(true);
    setError(null);
    setDataA(null);
    setDataB(null);

    try {
      const [profileA, contestsA, profileB, contestsB] = await Promise.all([
        fetchUserProfile(a),
        fetchContestHistory(a),
        fetchUserProfile(b),
        fetchContestHistory(b),
      ]);

      const predA = predictRating(contestsA.contestHistory || []);
      const predB = predictRating(contestsB.contestHistory || []);

      setDataA({ profile: profileA, contests: contestsA.contestHistory || [], prediction: predA });
      setDataB({ profile: profileB, contests: contestsB.contestHistory || [], prediction: predB });
    } catch (err) {
      setError(err.message || 'Failed to fetch data for one or both users.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>Compare Users</h2>
        <p>See how two LeetCode competitors stack up side by side</p>
      </div>

      <form onSubmit={handleCompare}>
        <div className="compare-input-row">
          <input
            type="text"
            className="compare-input"
            placeholder="Username A"
            value={userA}
            onChange={(e) => setUserA(e.target.value)}
            required
          />
          <div className="vs-badge">VS</div>
          <input
            type="text"
            className="compare-input"
            placeholder="Username B"
            value={userB}
            onChange={(e) => setUserB(e.target.value)}
            required
          />
        </div>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <button type="submit" className="search-btn" disabled={loading}>
            {loading ? 'Comparing...' : 'Compare'}
          </button>
        </div>
      </form>

      {loading && <LoadingSpinner text="Comparing users..." />}
      {error && <ErrorMessage message={error} />}

      {dataA && dataB && (
        <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="compare-grid">
            <ProfileCard profile={dataA.profile} />
            <ProfileCard profile={dataB.profile} />
          </div>
          <div className="compare-grid">
            <PredictionCard prediction={dataA.prediction} />
            <PredictionCard prediction={dataB.prediction} />
          </div>
          {dataA.contests.length > 0 && (
            <RatingChart
              contestHistory={dataA.contests}
              prediction={dataA.prediction}
              label="User A"
            />
          )}
          {dataB.contests.length > 0 && (
            <RatingChart
              contestHistory={dataB.contests}
              prediction={dataB.prediction}
              label="User B"
            />
          )}
        </div>
      )}
    </>
  );
}
