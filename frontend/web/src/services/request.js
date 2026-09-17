const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const error = new Error((body && body.message) || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.body = body;
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
