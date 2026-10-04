import api, { unwrap } from './client.js';

// { invoices, page, pages, total }; filters: { page, search, status }
export const listInvoices = async (filters = {}) => unwrap(await api.get('/invoices', { params: filters })).data;

export const getInvoice = async (id) => unwrap(await api.get(`/invoices/${id}`)).data.invoice;

// invoice: { customer, issueDate, dueDate, currency, items, discountPercent, taxPercent, notes }
export const createInvoice = async (invoice) => unwrap(await api.post('/invoices', invoice));
export const updateInvoice = async (id, invoice) => unwrap(await api.put(`/invoices/${id}`, invoice));
export const deleteInvoice = async (id) => unwrap(await api.delete(`/invoices/${id}`));
export const duplicateInvoice = async (id) => unwrap(await api.post(`/invoices/${id}/duplicate`));

// status: "draft", "sent" or "paid"; paidDate only with "paid"
export const changeStatus = async (id, status, paidDate) => unwrap(await api.patch(`/invoices/${id}/status`, { status, paidDate }));
