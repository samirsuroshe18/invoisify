import { STATUS_LABELS, statusOf } from '../lib/format';

const STYLES = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  overdue: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700',
};

const StatusBadge = ({ invoice }) => {
  const status = statusOf(invoice);

  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
};

export default StatusBadge;
