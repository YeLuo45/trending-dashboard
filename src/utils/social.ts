import type { FavoriteItem, SharedList, FollowedAuthor } from '../types';

const FAVORITES_KEY = 'favorites';
const SHARED_LISTS_KEY = 'shared_lists';
const FOLLOWED_AUTHORS_KEY = 'followed_authors';
const MAX_FAVORITES = 500;
const MAX_FOLLOWED_AUTHORS = 20;

// ============ Favorites ============
export function getFavorites(): FavoriteItem[] {
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addFavorite(project: Omit<FavoriteItem, 'starredAt'>): boolean {
  const favorites = getFavorites();
  if (favorites.length >= MAX_FAVORITES) return false;
  if (favorites.some(f => f.name === project.name)) return false;
  
  favorites.unshift({ ...project, starredAt: new Date().toLocaleString() });
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  return true;
}

export function removeFavorite(name: string): void {
  const favorites = getFavorites().filter(f => f.name !== name);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

export function isFavorited(name: string): boolean {
  return getFavorites().some(f => f.name === name);
}

export function updateFavoriteCategory(name: string, category: string): void {
  const favorites = getFavorites().map(f => 
    f.name === name ? { ...f, category } : f
  );
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

// ============ Shared Lists ============
export function getSharedLists(): Record<string, SharedList> {
  try {
    return JSON.parse(localStorage.getItem(SHARED_LISTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function createSharedList(projects: FavoriteItem[], title?: string): string {
  const id = generateId();
  const sharedList: SharedList = {
    id,
    projects: projects.slice(0, 10), // Max 10 projects per share
    createdAt: new Date().toLocaleString(),
    title,
  };
  
  const lists = getSharedLists();
  lists[id] = sharedList;
  localStorage.setItem(SHARED_LISTS_KEY, JSON.stringify(lists));
  return id;
}

export function getSharedList(id: string): SharedList | null {
  const lists = getSharedLists();
  return lists[id] || null;
}

export function deleteSharedList(id: string): void {
  const lists = getSharedLists();
  delete lists[id];
  localStorage.setItem(SHARED_LISTS_KEY, JSON.stringify(lists));
}

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// ============ Followed Authors ============
export function getFollowedAuthors(): FollowedAuthor[] {
  try {
    return JSON.parse(localStorage.getItem(FOLLOWED_AUTHORS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function followAuthor(username: string): boolean {
  const authors = getFollowedAuthors();
  if (authors.length >= MAX_FOLLOWED_AUTHORS) return false;
  if (authors.some(a => a.username.toLowerCase() === username.toLowerCase())) return false;
  
  authors.unshift({ username, followedAt: new Date().toLocaleString() });
  localStorage.setItem(FOLLOWED_AUTHORS_KEY, JSON.stringify(authors));
  return true;
}

export function unfollowAuthor(username: string): void {
  const authors = getFollowedAuthors().filter(
    a => a.username.toLowerCase() !== username.toLowerCase()
  );
  localStorage.setItem(FOLLOWED_AUTHORS_KEY, JSON.stringify(authors));
}

export function isFollowing(username: string): boolean {
  return getFollowedAuthors().some(
    a => a.username.toLowerCase() === username.toLowerCase()
  );
}

export function getFollowedUsernames(): Set<string> {
  return new Set(getFollowedAuthors().map(a => a.username.toLowerCase()));
}

// Check if any followed authors have new projects today (by comparing with provided project list)
export function getNewProjectsFromFollowedAuthors(
  projects: { name: string; link: string }[]
): { username: string; projects: { name: string; link: string }[] }[] {
  const followed = getFollowedUsernames();
  const result: { username: string; projects: { name: string; link: string }[] }[] = [];
  
  const authorProjects = new Map<string, { name: string; link: string }[]>();
  
  for (const project of projects) {
    const parts = project.name.split('/');
    if (parts.length >= 2) {
      const author = parts[0].toLowerCase();
      if (followed.has(author)) {
        if (!authorProjects.has(author)) {
          authorProjects.set(author, []);
        }
        authorProjects.get(author)!.push({ name: project.name, link: project.link });
      }
    }
  }
  
  authorProjects.forEach((projects, username) => {
    result.push({ username, projects });
  });
  
  return result;
}
