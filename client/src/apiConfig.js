const DEFAULT_API_BASE = 'http://localhost:4000/api';

function normalizeApiBase(value) {
  const rawValue = `${value || ''}`.trim();

  if (!rawValue) {
    return DEFAULT_API_BASE;
  }

  const equalsIndex = rawValue.indexOf('=');
  const withoutEnvName = equalsIndex >= 0 ? rawValue.slice(equalsIndex + 1).trim() : rawValue;
  const withoutTrailingSlash = withoutEnvName.replace(/\/+$/, '');

  return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : `${withoutTrailingSlash}/api`;
}

export const API_BASE = normalizeApiBase(
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL,
);
