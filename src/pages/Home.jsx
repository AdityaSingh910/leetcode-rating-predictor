import React, { useState } from 'react';
import SearchBar from '../components/SearchBar';
import ProfileCard from '../components/ProfileCard';
import PredictionCard from '../components/PredictionCard';
import RatingChart from '../components/RatingChart';
import ContestTable from '../components/ContestTable';
import LoadingSpinner, { ErrorMessage } from '../components/LoadingSpinner';
import { fetchUserProfile, fetchContestHistory } from '../api/leetcode';
import { predictRating } from '../utils/predictor';

export default function Home() {
  const [profile, setProfile] = useState(null);
  const [contests, setContests] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (username) => {
    setLoading(true);
    setError(null);
    setProfile(null);
    setContests(null);
    setPrediction(null);

    try {
      const [profileData, contestData] = await Promise.all([
        fetchUserProfile(username),
        fetchContestHistory(username),
      ]);

      if (!contestData.contestHistory || contestData.contestHistory.length === 0) {
        setError("This user hasn't participated in any contests yet.");
        return;
      }

      const pred = predictRating(contestData.contestHistory);

      setProfile(profileData);
      setContests(contestData.contestHistory);
      setPrediction(pred);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-title">
        <h2>Predict Contest Rating</h2>
        <p>Enter a LeetCode username to forecast their next contest performance</p>
      </div>

      <div style={{ marginBottom: '32px' }}>
        <SearchBar onSearch={handleSearch} loading={loading} />
      </div>

      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}

      {profile && prediction && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ProfileCard profile={profile} />
          <PredictionCard prediction={prediction} currentRating={profile.userContestRanking?.rating} />
          <RatingChart contestHistory={contests} prediction={prediction} />
          <ContestTable contestHistory={contests} />
        </div>
      )}
    </>
  );
}
