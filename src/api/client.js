// Phoenix RP Forum - API Client Layer

const TOKEN_KEY = 'phoenix_auth_jwt_token';

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY)
};

export function getApiBase() {
  if (typeof window !== 'undefined') {
    if (window.__PHOENIX_CONFIG__ && window.__PHOENIX_CONFIG__.apiUrl) {
      return window.__PHOENIX_CONFIG__.apiUrl.replace(/\/$/, '');
    }
    if (window.__PHOENIX_API_URL__) {
      return window.__PHOENIX_API_URL__.replace(/\/$/, '');
    }
  }
  return (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
}

export function getMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/uploads/')) {
    const base = getApiBase();
    return base ? `${base}${path}` : path;
  }
  return path;
}

async function request(url, options = {}) {
  const token = authStorage.getToken();
  const headers = {
    ...options.headers
  };

  const apiBase = getApiBase();
  const targetUrl = (url.startsWith('/api') && apiBase) ? `${apiBase}${url}` : url;

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is an object and not FormData, stringify JSON
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  try {
    const res = await fetch(targetUrl, {
      ...options,
      headers,
      body
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.error || `Ошибка сервера (${res.status})`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.error(`[API Error] ${options.method || 'GET'} ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  auth: {
    login: (identifier, password) => request('/api/auth/login', { method: 'POST', body: { identifier, password } }),
    register: (email, username, password) => request('/api/auth/register', { method: 'POST', body: { email, username, password } }),
    me: () => request('/api/auth/me'),
    updateProfile: (profileData) => request('/api/auth/profile', { method: 'PUT', body: profileData }),
    updateAvatar: (formDataOrUrl) => {
      if (formDataOrUrl instanceof FormData) {
        return request('/api/auth/avatar', { method: 'POST', body: formDataOrUrl });
      } else {
        return request('/api/auth/avatar', { method: 'POST', body: { avatarUrl: formDataOrUrl } });
      }
    },
    updateCover: (formDataOrUrl) => {
      if (formDataOrUrl instanceof FormData) {
        return request('/api/auth/cover', { method: 'POST', body: formDataOrUrl });
      } else {
        return request('/api/auth/cover', { method: 'POST', body: { coverUrl: formDataOrUrl } });
      }
    },
    logout: async () => {
      try {
        await request('/api/auth/logout', { method: 'POST' });
      } catch {}
      authStorage.clearToken();
    }
  },

  // Categories
  categories: {
    getAll: () => request('/api/categories'),
    getBySlug: (slug, filter = 'all', page = 1) => request(`/api/categories/${encodeURIComponent(slug)}?filter=${filter}&page=${page}`)
  },

  // Threads
  threads: {
    getRecent: () => request('/api/threads/recent'),
    getById: (id) => request(`/api/threads/${encodeURIComponent(id)}`),
    create: (threadData) => request('/api/threads', { method: 'POST', body: threadData }),
    update: (id, threadData) => request(`/api/threads/${encodeURIComponent(id)}`, { method: 'PUT', body: threadData }),
    togglePin: (id) => request(`/api/threads/${encodeURIComponent(id)}/pin`, { method: 'PUT' }),
    toggleLock: (id) => request(`/api/threads/${encodeURIComponent(id)}/lock`, { method: 'PUT' }),
    toggleSubscribe: (id) => request(`/api/threads/${encodeURIComponent(id)}/subscribe`, { method: 'POST' }),
    delete: (id) => request(`/api/threads/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  // Posts
  posts: {
    create: (postData) => request('/api/posts', { method: 'POST', body: postData }),
    update: (id, content) => request(`/api/posts/${encodeURIComponent(id)}`, { method: 'PUT', body: { content } }),
    delete: (id) => request(`/api/posts/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    react: (id, reaction_type) => request(`/api/posts/${encodeURIComponent(id)}/react`, { method: 'POST', body: { reaction_type } }),
    setSolution: (id) => request(`/api/posts/${encodeURIComponent(id)}/solution`, { method: 'PUT' })
  },

  // Messages (Личные сообщения / Диалоги)
  messages: {
    getConversations: () => request('/api/messages/conversations'),
    getMessages: (conversationId) => request(`/api/messages/conversations/${encodeURIComponent(conversationId)}`),
    send: (data) => request('/api/messages/send', { method: 'POST', body: data }),
    getUnreadCount: () => request('/api/messages/unread-count')
  },

  // Search
  search: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/search?${query}`);
  },

  // Users
  users: {
    getMembers: (params = {}) => {
      const query = new URLSearchParams(params).toString();
      return request(`/api/users?${query}`);
    },
    getProfile: (idOrName) => request(`/api/users/${encodeURIComponent(idOrName)}`),
    getOnlineStats: () => request('/api/users/stats/online'),
    heartbeat: () => request('/api/users/heartbeat', { method: 'POST' })
  },

  // Notifications
  notifications: {
    getAll: () => request('/api/notifications'),
    markAllRead: () => request('/api/notifications/read-all', { method: 'PUT' }),
    markRead: (id) => request(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' })
  },

  // Reports
  reports: {
    create: (reportData) => request('/api/reports', { method: 'POST', body: reportData }),
    getReports: (status = 'pending') => request(`/api/reports?status=${status}`),
    resolve: (id, resolutionData) => request(`/api/reports/${encodeURIComponent(id)}`, { method: 'PUT', body: resolutionData })
  },

  // Badges (Плашки и роли)
  badges: {
    getCustom: () => request('/api/users/badges/custom')
  },

  // Admin
  admin: {
    getStats: () => request('/api/admin/stats'),
    // Forum Categories (Top-level Groupings)
    getForumCategories: () => request('/api/admin/forum-categories'),
    createForumCategory: (data) => request('/api/admin/forum-categories', { method: 'POST', body: data }),
    updateForumCategory: (id, data) => request(`/api/admin/forum-categories/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
    deleteForumCategory: (id) => request(`/api/admin/forum-categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    reorderForumCategories: (order) => request('/api/admin/forum-categories/reorder', { method: 'POST', body: { order } }),

    // Sections (Разделы)
    createCategory: (data) => request('/api/admin/categories', { method: 'POST', body: data }),
    updateCategory: (id, data) => request(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
    deleteCategory: (id) => request(`/api/admin/categories/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    changeUserRole: (userId, role) => request(`/api/admin/users/${encodeURIComponent(userId)}/role`, { method: 'PUT', body: { role } }),
    banUser: (userId, data) => request(`/api/admin/users/${encodeURIComponent(userId)}/ban`, { method: 'PUT', body: data }),
    warnUser: (userId, data) => request(`/api/admin/users/${encodeURIComponent(userId)}/warn`, { method: 'POST', body: data }),
    getAuditLogs: () => request('/api/admin/audit-logs'),

    // Custom Badges Management (Only Superadmin & Admin)
    getCustomBadges: () => request('/api/admin/custom-badges'),
    createCustomBadge: (data) => request('/api/admin/custom-badges', { method: 'POST', body: data }),
    updateCustomBadge: (id, data) => request(`/api/admin/custom-badges/${encodeURIComponent(id)}`, { method: 'PUT', body: data }),
    deleteCustomBadge: (id) => request(`/api/admin/custom-badges/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    // User Multi-Badges
    getUserBadges: (userId) => request(`/api/admin/users/${encodeURIComponent(userId)}/badges`),
    assignUserBadge: (userId, badgeKey, isPrimary = false) => request(`/api/admin/users/${encodeURIComponent(userId)}/badges`, { method: 'POST', body: { badge_key: badgeKey, is_primary: isPrimary } }),
    removeUserBadge: (userId, badgeKey) => request(`/api/admin/users/${encodeURIComponent(userId)}/badges/${encodeURIComponent(badgeKey)}`, { method: 'DELETE' })
  },

  // Uploads
  upload: {
    image: (file) => {
      const formData = new FormData();
      formData.append('image', file);
      return request('/api/upload', { method: 'POST', body: formData });
    }
  }
};
