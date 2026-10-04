import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Bar } from 'react-chartjs-2';
import { getDashboard } from '../api/invoiceApi';
import { getBusiness } from '../api/businessApi';
import { errorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { dayLabel, money, monthLabel } from '../lib/format';
import '../lib/charts';

const AMOUNTS = [
  { key: 'invoiced', label: 'Invoiced', hint: 'sent and paid', color: 'text-gray-800' },
  { key: 'paid', label: 'Paid', hint: 'received', color: 'text-green-700' },
  { key: 'outstanding', label: 'Outstanding', hint: 'sent, not yet paid', color: 'text-blue-700' },
  { key: 'overdue', label: 'Overdue', hint: 'past the due date', color: 'text-red-700' },
];

const COUNTS = [
  { status: 'draft', label: 'Drafts' },
  { status: 'sent', label: 'Sent' },
  { status: 'overdue', label: 'Overdue' },
  { status: 'paid', label: 'Paid' },
];

// what was invoiced and what was paid in each of the last six months
const MonthChart = ({ byMonth, currency }) => {
  const data = {
    labels: byMonth.map((row) => monthLabel(row.month)),
    datasets: [
      { label: 'Invoiced', data: byMonth.map((row) => row.invoiced), backgroundColor: '#2563eb' },
      { label: 'Paid', data: byMonth.map((row) => row.paid), backgroundColor: '#16a34a' },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { boxWidth: 14 } },
      tooltip: { callbacks: { label: (item) => `${item.dataset.label}: ${money(item.raw, currency)}` } },
    },
    scales: { y: { beginAtZero: true, ticks: { callback: (value) => Number(value).toLocaleString('en-US', { notation: 'compact' }) } } },
  };

  return (
    <div className="h-64 md:h-80">
      <Bar data={data} options={options} aria-label={`Invoiced and paid by month, in ${currency}`} role="img" />
    </div>
  );
};

// where the user lands: what was invoiced, what came in, what is still open
const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [data, setData] = useState(null);
  const [business, setBusiness] = useState(null);
  const [currency, setCurrency] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([getDashboard(), getBusiness()])
      .then(([dashboard, profile]) => {
        if (cancelled) return;
        setData(dashboard);
        setBusiness(profile);
        setCurrency(dashboard.defaultCurrency);
      })
      .catch((failure) => { if (!cancelled) setError(errorMessage(failure)); });

    return () => { cancelled = true; };
  }, []);

  const figures = data?.figures[currency];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 break-words">Welcome back, {user.name}</h1>
          <p className="text-gray-600">Here is where your invoices stand.</p>
        </div>
        <Link to="/invoices/new" className="btn-primary">New invoice</Link>
      </div>

      {error && <p role="alert" className="text-red-600">{error}</p>}
      {!error && !data && <p className="text-gray-500" role="status">Loading…</p>}

      {business && !business.complete && (
        <div className="card p-5 border-blue-200 bg-blue-50">
          <h2 className="font-semibold text-gray-800">Start with your business profile</h2>
          <p className="text-sm text-gray-600 mt-1">Your company name and details appear on every invoice. Fill them in once.</p>
          <Link to="/settings" className="btn-primary mt-3">Open settings</Link>
        </div>
      )}

      {figures && (
        <>
          {data.currencies.length > 1 && (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Currency">
              <span className="text-sm text-gray-600">Amounts in</span>
              {data.currencies.map((code) => (
                <button
                  key={code}
                  onClick={() => setCurrency(code)}
                  aria-pressed={currency === code}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition ${currency === code ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >
                  {code}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {AMOUNTS.map(({ key, label, hint, color }) => (
              <div key={key} className="card p-4">
                <p className="text-sm text-gray-600">{label}</p>
                <p className={`text-xl md:text-2xl font-bold mt-1 break-words ${color}`}>{money(figures[key], currency)}</p>
                <p className="text-xs text-gray-500">{hint}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {COUNTS.map(({ status, label }) => (
              <Link key={status} to={`/invoices?status=${status}`} className="card p-4 hover:shadow-md transition">
                <p className="text-2xl font-bold text-gray-800">{data.counts[status]}</p>
                <p className="text-sm text-gray-600">{label}</p>
              </Link>
            ))}
          </div>

          <section className="card p-5">
            <h2 className="font-semibold text-gray-800 mb-3">The last six months</h2>
            <MonthChart byMonth={figures.byMonth} currency={currency} />
          </section>

          <section className="card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-800">Latest invoices</h2>
              {data.recent.length > 0 && <Link to="/invoices" className="text-sm text-blue-600 hover:underline">See all</Link>}
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
                      <span className="font-medium text-gray-800 min-w-[8rem] text-right break-words">{money(invoice.total, invoice.currency)}</span>
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
