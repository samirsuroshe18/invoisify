export const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP'];

const LOCALES = { INR: 'en-IN', USD: 'en-US', EUR: 'en-IE', GBP: 'en-GB' };

// an amount with its currency: ₹3,824.23
export const money = (amount, currency = 'INR') =>
  new Intl.NumberFormat(LOCALES[currency] || 'en-IN', { style: 'currency', currency, minimumFractionDigits: 2 }).format(Number(amount) || 0);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-03-15" as "15 Mar 2026", the same in every time zone
export const dayLabel = (day) => {
  if (!day) return '';
  const [year, month, date] = day.split('-').map(Number);
  return `${date} ${MONTHS[month - 1]} ${year}`;
};

// today in the visitor's own calendar, as the date boxes want it
export const localToday = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

export const addDays = (day, count) => {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, date + count)).toISOString().slice(0, 10);
};

// what an invoice is called on screen; overdue is a sent invoice past its due date
export const statusOf = (invoice) => (invoice.overdue ? 'overdue' : invoice.status);

export const STATUS_LABELS = { draft: 'Draft', sent: 'Sent', overdue: 'Overdue', paid: 'Paid' };

// "2026-03" as "Mar 2026"
export const monthLabel = (month) => {
  const [year, index] = month.split('-').map(Number);
  return `${MONTHS[index - 1]} ${year}`;
};
