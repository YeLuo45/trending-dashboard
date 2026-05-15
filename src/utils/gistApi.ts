import type { Comment } from '../types';
import { getGhToken } from './github';

const GIST_FILENAME = 'trending-dashboard-comments.json';
const GIST_DESC = 'Trending Dashboard Comments Backup';
const GIST_ID_KEY = 'gist_id';

// ============ Gist CRUD ============

interface GistFile {
  content: string;
}

interface GistPayload {
  description?: string;
  public?: boolean;
  files?: Record<string, GistFile>;
}

async function gistFetch(path: string, options: RequestInit, token: string) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

export async function loadGistComments(token: string): Promise<Record<string, Comment[]>> {
  const gistId = localStorage.getItem(GIST_ID_KEY);
  if (!gistId) return {};

  try {
    const res = await gistFetch(`/gists/${gistId}`, { method: 'GET' }, token);
    if (res.status === 404) {
      localStorage.removeItem(GIST_ID_KEY);
      return {};
    }
    if (!res.ok) return {};

    const gist = await res.json() as { files?: Record<string, { content?: string }> };
    const file = gist.files?.[GIST_FILENAME];
    if (!file?.content) return {};

    return JSON.parse(file.content) as Record<string, Comment[]>;
  } catch {
    return {};
  }
}

export async function saveGistComments(
  token: string,
  data: Record<string, Comment[]>
): Promise<boolean> {
  const content = JSON.stringify(data, null, 2);
  const gistId = localStorage.getItem(GIST_ID_KEY);
  const encoded = btoa(unescape(encodeURIComponent(content)));

  const payload: GistPayload = {
    description: GIST_DESC,
    public: false,
    files: {
      [GIST_FILENAME]: { content },
    },
  };

  try {
    let res: Response;

    if (gistId) {
      // Get current gist SHA for update
      const getRes = await gistFetch(`/gists/${gistId}`, { method: 'GET' }, token);
      let sha: string | undefined;
      if (getRes.ok) {
        const gist = await getRes.json() as { sha?: string; files?: Record<string, unknown> };
        sha = gist.sha;
      }

      res = await gistFetch(`/gists/${gistId}`, {
        method: 'PATCH',
        headers: {},
        body: JSON.stringify({ ...payload, sha }),
      }, token);
    } else {
      res = await gistFetch('/gists', {
        method: 'POST',
        headers: {},
        body: JSON.stringify(payload),
      }, token);

      if (res.ok) {
        const gist = await res.json() as { id?: string };
        if (gist.id) {
          localStorage.setItem(GIST_ID_KEY, gist.id);
        }
      }
    }

    return res.ok;
  } catch {
    return false;
  }
}

// ============ High-level sync API (hybrid: Gist + localStorage) ============

export interface CommentsPayload {
  data: Record<string, Comment[]>;
  version: number;
}

export async function syncCommentsToRemote(data: Record<string, Comment[]>): Promise<void> {
  const token = getGhToken();
  if (!token) return;

  await saveGistComments(token, data);
}

export async function loadCommentsWithRemote(
  localData: Record<string, Comment[]>
): Promise<Record<string, Comment[]>> {
  const token = getGhToken();
  if (!token) return localData;

  const remoteData = await loadGistComments(token);
  // Merge: remote wins for same-keyed entries (they're newer)
  const merged = { ...localData };
  for (const [projectName, comments] of Object.entries(remoteData)) {
    if (!merged[projectName] || merged[projectName].length === 0) {
      merged[projectName] = comments;
    } else {
      // Merge comments by id, dedupe
      const allComments = [...merged[projectName], ...comments];
      const seen = new Set<string>();
      const deduped = allComments.filter(c => {
        if (seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });
      // Sort by newest first
      deduped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      merged[projectName] = deduped;
    }
  }
  return merged;
}
