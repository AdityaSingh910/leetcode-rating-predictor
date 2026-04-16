import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

const HEADERS = {
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
};

// ========================================
// User Profile + Contest Ranking
// ========================================
app.get('/api/user/:username', async (req, res) => {
  const { username } = req.params;
  const query = `
    query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        totalParticipants
        topPercentage
        badge {
          name
        }
      }
      matchedUser(username: $username) {
        username
        profile {
          realName
          userAvatar
          ranking
        }
      }
    }
  `;

  try {
    const response = await fetch(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ query, variables: { username } }),
    });
    const data = await response.json();
    if (!data.data || !data.data.matchedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(data.data);
  } catch (err) {
    console.error('Error fetching user profile:', err.message);
    res.status(500).json({ error: 'Failed to fetch user data from LeetCode' });
  }
});

// ========================================
// User Contest History
// ========================================
app.get('/api/user/:username/contests', async (req, res) => {
  const { username } = req.params;
  const query = `
    query userContestRankingHistory($username: String!) {
      userContestRankingHistory(username: $username) {
        attended
        trendDirection
        problemsSolved
        totalProblems
        finishTimeInSeconds
        rating
        ranking
        contest {
          title
          startTime
        }
      }
    }
  `;

  try {
    const response = await fetch(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ query, variables: { username } }),
    });
    const data = await response.json();
    if (!data.data || !data.data.userContestRankingHistory) {
      return res.status(404).json({ error: 'No contest history found' });
    }
    const attended = data.data.userContestRankingHistory.filter(c => c.attended);
    res.json({ contestHistory: attended });
  } catch (err) {
    console.error('Error fetching contest history:', err.message);
    res.status(500).json({ error: 'Failed to fetch contest history from LeetCode' });
  }
});

// ========================================
// Recent Contests List
// ========================================
app.get('/api/contests', async (req, res) => {
  const query = `
    query {
      allContests {
        title
        titleSlug
        startTime
        duration
        originStartTime
        isVirtual
      }
    }
  `;

  try {
    const response = await fetch(LEETCODE_GRAPHQL, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ query }),
    });
    const data = await response.json();
    if (!data.data || !data.data.allContests) {
      return res.status(404).json({ error: 'Could not fetch contests' });
    }
    // Return last 20 non-virtual, past contests only
    const now = Math.floor(Date.now() / 1000);
    const contests = data.data.allContests
      .filter(c => !c.isVirtual && (parseInt(c.startTime) + (c.duration || 5400)) < now)
      .slice(0, 20);
    res.json({ contests });
  } catch (err) {
    console.error('Error fetching contests:', err.message);
    res.status(500).json({ error: 'Failed to fetch contests from LeetCode' });
  }
});

// ========================================
// Contest Ranking (Leaderboard) — uses REST API
// ========================================
app.get('/api/contest/:slug/ranking', async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page) || 1;

  try {
    const url = `https://leetcode.com/contest/api/ranking/${slug}/?pagination=${page}&region=global`;
    const response = await fetch(url, { headers: HEADERS });

    if (!response.ok) {
      return res.status(404).json({ error: 'Contest ranking not found' });
    }

    const data = await response.json();

    // Normalize to our format
    const result = {
      totalParticipants: data.user_num || 0,
      userRankings: (data.total_rank || []).map(u => ({
        ranking: u.rank,
        score: u.score,
        finishTimeInSeconds: u.finish_time,
        username: u.username,
        currentRating: u.current_rating || null,
        currentGlobalRanking: u.current_global_ranking || null,
      })),
    };

    res.json(result);
  } catch (err) {
    console.error('Error fetching contest ranking:', err.message);
    res.status(500).json({ error: 'Failed to fetch contest ranking' });
  }
});

// ========================================
// Serve static build in production
// ========================================
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});
