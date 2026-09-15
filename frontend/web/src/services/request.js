import { fetch } from 'whatwg-fetch';

const request = {
  get: (url, options = {}) => {
    return fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });
  },

  post: (url, data, options = {}) => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      credentials: 'include',
      ...options,
    });
  },

  put: (url, data, options = {}) => {
    return fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(data),
      credentials: 'include',
      ...options,
    });
  },

  delete: (url, options = {}) => {
    return fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });
  },
};

export default request;