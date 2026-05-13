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

export async function fetchReadme(owner: string, repo: string, token?: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    // GitHub returns README content base64 encoded
    const content = atob(data.content);
    // Convert markdown-like content to HTML (basic sanitization)
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>')
      .substring(0, 2000);
  } catch {
    return null;
  }
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

// Fork history remote sync via GitHub API
export interface ForkHistoryRecord {
  name: string;
  link: string;
  description: string;
  forkedAt: string;
  url: string;
}

export interface ForkHistoryPayload {
  records: ForkHistoryRecord[];
  syncedAt: string;
}

const FORK_HISTORY_FILE = 'fork-history.json';
const REPO_OWNER = 'YeLuo45';
const REPO_NAME = 'trending-dashboard';

export async function loadRemoteForkHistory(token: string): Promise<ForkHistoryRecord[]> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FORK_HISTORY_FILE}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );
    if (res.status === 404) return [];
    if (!res.ok) return [];
    const data = await res.json();
    const content = atob(data.content);
    const payload: ForkHistoryPayload = JSON.parse(content);
    return payload.records || [];
  } catch {
    return [];
  }
}

export async function saveRemoteForkHistory(
  token: string,
  records: ForkHistoryRecord[]
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current file SHA (if exists)
    let sha: string | undefined;
    try {
      const getRes = await fetch(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FORK_HISTORY_FILE}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (getRes.ok) {
        const getData = await getRes.json();
        sha = getData.sha;
      }
    } catch {
      // File doesn't exist, will create new
    }

    const payload: ForkHistoryPayload = {
      records,
      syncedAt: new Date().toISOString(),
    };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));

    const body: Record<string, string> = {
      message: `chore: sync fork history (${records.length} records)`,
      content: encoded,
    };
    if (sha) body.sha = sha;

    const res = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FORK_HISTORY_FILE}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (res.status === 200 || res.status === 201) {
      return { success: true };
    }
    const errData = await res.json().catch(() => ({}));
    return { success: false, error: `API ${res.status}: ${errData.message || res.statusText}` };
  } catch (e: unknown) {
    return { success: false, error: `网络错误: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function syncForkHistory(
  localRecords: ForkHistoryRecord[],
  token: string
): Promise<{ records: ForkHistoryRecord[]; updated: boolean; error?: string }> {
  // Load remote
  const remoteRecords = await loadRemoteForkHistory(token);
  // Merge: remote records not in local, plus all local
  const merged = mergeForkRecords(remoteRecords, localRecords);
  // Save merged back to remote
  const saveResult = await saveRemoteForkHistory(token, merged);
  if (!saveResult.success) {
    return { records: localRecords, updated: false, error: saveResult.error };
  }
  return { records: merged, updated: true };
}

function mergeForkRecords(remote: ForkHistoryRecord[], local: ForkHistoryRecord[]): ForkHistoryRecord[] {
  const map = new Map<string, ForkHistoryRecord>();
  for (const r of remote) map.set(r.name, r);
  for (const l of local) {
    const existing = map.get(l.name);
    if (!existing || new Date(l.forkedAt) > new Date(existing.forkedAt)) {
      map.set(l.name, l);
    }
  }
  return Array.from(map.values()).sort((a, b) => new Date(b.forkedAt).getTime() - new Date(a.forkedAt).getTime());
}
