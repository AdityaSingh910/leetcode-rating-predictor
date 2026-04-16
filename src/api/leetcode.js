const BASE_URL = '';

export async function fetchUserProfile(username) {
  const res = await fetch(`${BASE_URL}/api/user/${encodeURIComponent(username)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'User not found');
  }
  return res.json();
}

export async function fetchContestHistory(username) {
  const res = await fetch(`${BASE_URL}/api/user/${encodeURIComponent(username)}/contests`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'No contest history found');
  }
  return res.json();
}

export async function fetchContests() {
  const res = await fetch(`${BASE_URL}/api/contests`);
  if (!res.ok) throw new Error('Failed to fetch contests');
  return res.json();
}

export async function fetchContestRanking(slug, page = 1) {
  const res = await fetch(`${BASE_URL}/api/contest/${encodeURIComponent(slug)}/ranking?page=${page}`);
  if (!res.ok) throw new Error('Failed to fetch contest ranking');
  return res.json();
}
