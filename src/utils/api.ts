export function getApiUrl(path: string): string {
  const baseUrl = import.meta.env.VITE_API_URL || '';
  return `${baseUrl}${path}`;
}

export async function apiFetch(path: string, options?: RequestInit) {
  const url = getApiUrl(path);
  return fetch(url, options);
}
