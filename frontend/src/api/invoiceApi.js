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

// emails the customer a link to the invoice; answers { data: { invoice, code }, message }
export const sendInvoice = async (id) => unwrap(await api.post(`/invoices/${id}/send`));

// the code of the invoice's public page, made if there is none yet
export const shareInvoice = async (id) => unwrap(await api.post(`/invoices/${id}/share`)).data.code;
export const stopSharing = async (id) => unwrap(await api.delete(`/invoices/${id}/share`));

// what anyone with the link sees
export const getPublicInvoice = async (code) => unwrap(await api.get(`/public/invoices/${code}`)).data.invoice;

// { defaultCurrency, currencies, figures: { [currency]: {...} }, recent }
export const getDashboard = async () => unwrap(await api.get('/dashboard')).data;
