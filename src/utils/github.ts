const GH_TOKEN_KEY = 'gh_token';

export function getGhToken(): string {
  return localStorage.getItem(GH_TOKEN_KEY) || '';
}

export function setGhToken(token: string): void {
  localStorage.setItem(GH_TOKEN_KEY, token);
}

export function clearGhToken(): void {
  localStorage.removeItem(GH_TOKEN_KEY);
}

export interface GhUser {
  login: string;
  avatar_url: string;
  name: string;
}

export async function fetchGhUser(token: string): Promise<GhUser | null> {
  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function forkRepo(owner: string, repo: string, token: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/forks`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Length': '0',
      },
    });

    if (res.status === 202) {
      // Accepted - fork is being processed
      // Poll for the fork to be ready
      const data = await res.json();
      return { success: true, url: data.html_url };
    }

    if (res.status === 401) {
      return { success: false, error: 'Token 无效，请检查后重试' };
    }
    if (res.status === 403) {
      return { success: false, error: '权限不足，请确认 Token 有 fork 权限' };
    }
    if (res.status === 404) {
      return { success: false, error: '仓库不存在或不可 fork' };
    }
    if (res.status === 409) {
      return { success: false, error: '已经 fork 过该仓库' };
    }

    const text = await res.text();
    return { success: false, error: `fork 失败 (${res.status}): ${text}` };
  } catch (e) {
    return { success: false, error: `网络错误: ${e}` };
  }
}

export function parseRepoInfo(link: string): { owner: string; repo: string } | null {
  // link format: https://github.com/owner/repo
  const match = link.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

export interface RepoStats {
  stars: number;
  forks: number;
}

export async function fetchRepoStats(owner: string, repo: string, token?: string): Promise<RepoStats | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return { stars: data.stargazers_count || 0, forks: data.forks_count || 0 };
  } catch {
    return null;
  }
}
