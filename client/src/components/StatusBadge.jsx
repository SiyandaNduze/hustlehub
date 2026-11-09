const LABELS = {
  confirmed: 'Confirmed',
  completed: 'Paid',
  pending: 'Pending',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
  live: 'Live',
  hidden: 'Hidden',
  client: 'Client',
  freelancer: 'Freelancer',
  admin: 'Admin',
};

export default function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  return <span className={`badge badge-${key}`}>{LABELS[key] || status}</span>;
}
