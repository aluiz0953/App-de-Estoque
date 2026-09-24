// A 401 means the server-side session is gone (in-memory, wiped on redeploy) while
// redux-persist still holds a user - App.jsx subscribes and clears it, which sends
// RequireAuth back to /login instead of leaving every page quietly failing.
const unauthorizedListeners = new Set();
export const onUnauthorized = (fn) => {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
};

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const error = new Error((body && body.message) || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.body = body;
    if (response.status === 401) unauthorizedListeners.forEach((fn) => fn());
    throw error;
  }

  return body;
};

export const get = (url, options = {}) => {
  return fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  }).then(parseResponse);
};

export const post = (url, data, options = {}) => {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    credentials: 'include',
    ...options,
  }).then(parseResponse);
};

export const put = (url, data, options = {}) => {
  return fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    body: JSON.stringify(data),
    credentials: 'include',
    ...options,
  }).then(parseResponse);
};

export const del = (url, options = {}) => {
  return fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  }).then(parseResponse);
};
