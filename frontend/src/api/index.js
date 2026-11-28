import { request } from './client';

const data = (promise) => promise.then((payload) => payload.data);

export const authApi = {
  login: (body) => data(request('/auth/login', { method: 'POST', body })),
  registrationStatus: () => data(request('/auth/registration')),
  register: (body) => data(request('/auth/registration', { method: 'POST', body })),
  logout: () => request('/auth/logout', { method: 'POST' }),
  recoverPassword: (body) => request('/auth/recover-password', { method: 'POST', body }),
  resetPassword: (body) => request('/auth/reset-password', { method: 'POST', body }),
  getProfile: () => data(request('/auth/profile')),
  updateProfile: (body) => data(request('/auth/profile', { method: 'PATCH', body })),
};

export const categoriesApi = {
  list: () => data(request('/categories')),
  create: (body) => data(request('/categories', { method: 'POST', body })),
  update: (id, body) => data(request(`/categories/${id}`, { method: 'PATCH', body })),
  remove: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

export const productsApi = {
  list: ({ search, categoryId } = {}) =>
    data(request('/products', { query: { search, category_id: categoryId } })),
  get: (id) => data(request(`/products/${id}`)),
  create: (body) => data(request('/products', { method: 'POST', body })),
  update: (id, body) => data(request(`/products/${id}`, { method: 'PATCH', body })),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};

export const businessApi = {
  get: () => data(request('/business-info')),
  update: (body) => data(request('/business-info', { method: 'PATCH', body })),
};

export const messagesApi = {
  create: (body) => data(request('/contact-messages', { method: 'POST', body })),
  list: ({ status, search, archived } = {}) =>
    data(request('/contact-messages', { query: { status, search, archived: archived ? 'true' : undefined } })),
  summary: () => data(request('/contact-messages/summary')),
  setArchived: (id, archived) => data(request(`/contact-messages/${id}`, { method: 'PATCH', body: { archived } })),
  updateStatus: (id, status) => data(request(`/contact-messages/${id}`, { method: 'PATCH', body: { status } })),
  updateNote: (id, internalNote) => data(request(`/contact-messages/${id}`, { method: 'PATCH', body: { internalNote } })),
  remove: (id) => request(`/contact-messages/${id}`, { method: 'DELETE' }),
};

export const quickRepliesApi = {
  list: () => data(request('/quick-replies')),
  create: (body) => data(request('/quick-replies', { method: 'POST', body })),
  update: (id, body) => data(request(`/quick-replies/${id}`, { method: 'PATCH', body })),
  remove: (id) => request(`/quick-replies/${id}`, { method: 'DELETE' }),
};

export const staffApi = {
  list: () => data(request('/admin-users')),
  create: (body) => data(request('/admin-users', { method: 'POST', body })),
  update: (id, body) => data(request(`/admin-users/${id}`, { method: 'PATCH', body })),
  remove: (id) => request(`/admin-users/${id}`, { method: 'DELETE' }),
};
