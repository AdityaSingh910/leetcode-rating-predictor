import React from 'react';

export default function ProfileCard({ profile, ranking }) {
  const user = profile?.matchedUser;
  if (!user) return null;

  const r = ranking || profile?.userContestRanking;

  return (
    <div className="glass-card fade-in-up">
      <div className="profile-header">
        <img
          src={user.profile.userAvatar || 'https://leetcode.com/static/images/LeetCode_logo_oj.png'}
          alt={user.username}
          className="profile-avatar"
        />
        <div>
          <h2 className="profile-name">{user.username}</h2>
          {user.profile.realName && (
            <p className="profile-real-name">{user.profile.realName}</p>
          )}
        </div>
        {r?.badge?.name && (
          <div className="profile-badge">{r.badge.name}</div>
        )}
      </div>

      {r && (
        <div className="profile-stats">
          <div className="stat-item">
            <span className="stat-value">{Math.round(r.rating).toLocaleString()}</span>
            <span className="stat-label">Current Rating</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{r.attendedContestsCount}</span>
            <span className="stat-label">Contests</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">#{r.globalRanking?.toLocaleString()}</span>
            <span className="stat-label">Global Rank</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{r.topPercentage?.toFixed(1)}%</span>
            <span className="stat-label">Top %</span>
          </div>
        </div>
      )}
    </div>
  );
}
