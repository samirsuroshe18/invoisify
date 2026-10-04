import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listInvoices } from '../api/invoiceApi';
import { errorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { dayLabel, money } from '../lib/format';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'paid', label: 'Paid' },
];

const SEARCH_WAIT_MS = 350;

// The user's invoices. The filter, the search and the page live in the address, so a
// reload or the back button returns to the same list.
const Invoices = () => {
  const [params, setParams] = useSearchParams();
  const status = FILTERS.some((filter) => filter.value === params.get('status')) ? params.get('status') : 'all';
  const search = params.get('search') || '';
  const page = Math.max(1, Number.parseInt(params.get('page'), 10) || 1);

  const [typed, setTyped] = useState(search);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const update = (changes) => {
    const next = { status, search, page: String(page), ...changes };
    const cleaned = Object.fromEntries(Object.entries(next).filter(([key, value]) =>
      value && !(key === 'status' && value === 'all') && !(key === 'page' && value === '1')));

    setParams(cleaned, { replace: true });
  };

  // the search starts a moment after the typing stops
  useEffect(() => {
    if (typed === search) return undefined;

    const timer = setTimeout(() => update({ search: typed.trim(), page: '1' }), SEARCH_WAIT_MS);
    return () => clearTimeout(timer);
    // only the typed text starts the timer
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    listInvoices({ status, search, page })
      .then((answer) => { if (!cancelled) setData(answer); })
      .catch((failure) => { if (!cancelled) { setData(null); setError(errorMessage(failure)); } })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [status, search, page]);

  const filtered = status !== 'all' || Boolean(search);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
        <Link to="/invoices/new" className="btn-primary">New invoice</Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              onClick={() => update({ status: filter.value, page: '1' })}
              aria-pressed={status === filter.value}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${status === filter.value ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-64 sm:ml-auto">
          <label htmlFor="search" className="sr-only">Search by number or customer</label>
          <input id="search" type="search" maxLength={80} className="field" placeholder="Search number or customer" value={typed} onChange={(e) => setTyped(e.target.value)} />
        </div>
      </div>

      {error && (
        <div role="alert" className="card p-6 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={() => update({})} className="btn-quiet mt-3">Try again</button>
        </div>
      )}

      {!error && loading && !data && <p className="text-gray-500" role="status">Loading invoices…</p>}

      {!error && data && data.invoices.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-gray-600">{filtered ? 'No invoices match.' : 'You have no invoices yet.'}</p>
          {!filtered && <Link to="/invoices/new" className="btn-primary mt-4">Create your first invoice</Link>}
        </div>
      )}

      {!error && data && data.invoices.length > 0 && (
        <div className={`card overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-200">
                <th scope="col" className="px-4 py-3 font-medium">Number</th>
                <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Issued</th>
                <th scope="col" className="px-4 py-3 font-medium whitespace-nowrap">Due</th>
                <th scope="col" className="px-4 py-3 font-medium text-right">Total</th>
                <th scope="col" className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.invoices.map((invoice) => (
                <tr key={invoice._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link to={`/invoices/${invoice._id}`} className="font-semibold text-blue-600 hover:underline">{invoice.number}</Link>
                  </td>
                  <td className="px-4 py-3 min-w-[10rem] break-words">{invoice.customer.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{dayLabel(invoice.issueDate)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{dayLabel(invoice.dueDate)}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap font-medium">{money(invoice.total, invoice.currency)}</td>
                  <td className="px-4 py-3"><StatusBadge invoice={invoice} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!error && data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <button className="btn-quiet" disabled={page <= 1 || loading} onClick={() => update({ page: String(page - 1) })}>Previous</button>
          <span className="text-sm text-gray-600">Page {data.page} of {data.pages} • {data.total} invoices</span>
          <button className="btn-quiet" disabled={page >= data.pages || loading} onClick={() => update({ page: String(page + 1) })}>Next</button>
        </div>
      )}
    </div>
  );
};

export default Invoices;
