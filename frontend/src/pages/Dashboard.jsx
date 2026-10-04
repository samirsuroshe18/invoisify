import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaFileInvoice, FaPaperPlane, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';
import { listInvoices } from '../api/invoiceApi';
import { getBusiness } from '../api/businessApi';
import { errorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { dayLabel, money } from '../lib/format';

const CARDS = [
  { status: 'draft', label: 'Drafts', icon: FaFileInvoice, color: 'text-gray-500' },
  { status: 'sent', label: 'Sent, waiting for payment', icon: FaPaperPlane, color: 'text-blue-600' },
  { status: 'overdue', label: 'Overdue', icon: FaExclamationCircle, color: 'text-red-600' },
  { status: 'paid', label: 'Paid', icon: FaCheckCircle, color: 'text-green-600' },
];

// where the user lands: what there is, by status, and the latest invoices
const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getBusiness(),
      listInvoices(),
      ...CARDS.map((card) => listInvoices({ status: card.status })),
    ])
      .then(([business, recent, ...byStatus]) => {
        if (cancelled) return;
        setData({
          business,
          recent: recent.invoices.slice(0, 5),
          total: recent.total,
          counts: Object.fromEntries(CARDS.map((card, index) => [card.status, byStatus[index].total])),
        });
      })
      .catch((failure) => { if (!cancelled) setError(errorMessage(failure)); });

    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user.name}</h1>
          <p className="text-gray-600">Here is where your invoices stand.</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">New invoice</Link>
      </div>

      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!error && !data && <p className="text-gray-500" role="status">Loading…</p>}

      {data && !data.business.complete && (
        <div className="card p-5 border-blue-200 bg-blue-50">
          <h2 className="font-semibold text-gray-800">Start with your business profile</h2>
          <p className="text-sm text-gray-600 mt-1">Your company name and details appear on every invoice. Fill them in once.</p>
          <Link to="/settings" className="btn-primary mt-3">Open settings</Link>
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CARDS.map(({ status, label, icon: Icon, color }) => (
              <Link key={status} to={`/invoices?status=${status}`} className="card p-4 hover:shadow-md transition">
                <Icon className={`text-2xl ${color}`} aria-hidden="true" />
                <p className="text-3xl font-bold text-gray-800 mt-2">{data.counts[status]}</p>
                <p className="text-sm text-gray-600">{label}</p>
              </Link>
            ))}
          </div>

          <section className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Latest invoices</h2>
              {data.total > 0 && <Link to="/invoices" className="text-sm text-blue-600 hover:underline">See all {data.total}</Link>}
            </div>

            {data.recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-500">No invoices yet. Create your first one.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {data.recent.map((invoice) => (
                  <li key={invoice._id}>
                    <Link to={`/invoices/${invoice._id}`} className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 hover:bg-gray-50">
                      <span className="font-semibold text-gray-800 w-24">{invoice.number}</span>
                      <span className="flex-1 min-w-[8rem] text-gray-700 break-words">{invoice.customer.name}</span>
                      <span className="text-sm text-gray-500">{dayLabel(invoice.issueDate)}</span>
                      <span className="font-medium text-gray-800 w-32 text-right">{money(invoice.total, invoice.currency)}</span>
                      <StatusBadge invoice={invoice} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Dashboard;
