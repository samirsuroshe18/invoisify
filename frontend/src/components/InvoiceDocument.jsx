import { forwardRef } from 'react';
import { dayLabel, money } from '../lib/format';

const DEFAULT_ACCENT = '#2563eb';

// An invoice as it looks on paper. The same rendering is used for the preview while
// typing, the invoice's own page and the PDF, so they can never differ.
// invoice: { number, business, customer, issueDate, dueDate, paidDate, currency, items (with amount),
//            discountPercent, taxPercent, subtotal, discountAmount, taxAmount, total, notes, status }
const InvoiceDocument = forwardRef(({ invoice }, ref) => {
  const { business = {}, customer = {}, currency } = invoice;
  const accent = business.accentColor || DEFAULT_ACCENT;
  const amount = (value) => money(value, currency);

  return (
    <div ref={ref} className="bg-white text-gray-900 p-5 sm:p-8 rounded-lg border border-gray-200 text-sm">
      <header className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b-4" style={{ borderColor: accent }}>
        <div className="min-w-0">
          {business.logoUrl && <img src={business.logoUrl} alt="" crossOrigin="anonymous" className="h-14 max-w-[10rem] object-contain mb-2" />}
          <h2 className="text-xl font-bold break-words">{business.companyName || 'Your company'}</h2>
          {business.address && <p className="text-gray-600 whitespace-pre-line break-words">{business.address}</p>}
          <p className="text-gray-600 break-words">{[business.email, business.phone].filter(Boolean).join(' • ')}</p>
        </div>
        <div className="text-right ml-auto">
          <p className="text-2xl font-bold tracking-wide" style={{ color: accent }}>INVOICE</p>
          <p className="font-semibold">{invoice.number || 'New invoice'}</p>
          {invoice.status === 'paid' && <p className="mt-1 font-semibold text-green-700">PAID</p>}
        </div>
      </header>

      <section className="flex flex-wrap justify-between gap-4 py-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-500">Invoice to</p>
          <p className="font-semibold break-words">{customer.name || 'Customer name'}</p>
          {customer.address && <p className="text-gray-600 whitespace-pre-line break-words">{customer.address}</p>}
          {customer.email && <p className="text-gray-600 break-words">{customer.email}</p>}
        </div>
        <dl className="text-right ml-auto">
          <div><dt className="inline text-gray-500">Issued: </dt><dd className="inline font-medium">{dayLabel(invoice.issueDate)}</dd></div>
          <div><dt className="inline text-gray-500">Due: </dt><dd className="inline font-medium">{dayLabel(invoice.dueDate)}</dd></div>
          {invoice.paidDate && <div><dt className="inline text-gray-500">Paid: </dt><dd className="inline font-medium">{dayLabel(invoice.paidDate)}</dd></div>}
        </dl>
      </section>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-white text-left" style={{ backgroundColor: accent }}>
              <th scope="col" className="px-3 py-2 font-semibold">Description</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Qty</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Rate</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="px-3 py-2 break-words">{item.description || '—'}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{item.quantity}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{amount(item.rate)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{amount(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="mt-4 ml-auto w-full sm:w-72 space-y-1">
        <div className="flex justify-between"><dt className="text-gray-600">Subtotal</dt><dd>{amount(invoice.subtotal)}</dd></div>
        {invoice.discountPercent > 0 && (
          <div className="flex justify-between"><dt className="text-gray-600">Discount ({invoice.discountPercent}%)</dt><dd>−{amount(invoice.discountAmount)}</dd></div>
        )}
        {invoice.taxPercent > 0 && (
          <div className="flex justify-between"><dt className="text-gray-600">Tax ({invoice.taxPercent}%)</dt><dd>{amount(invoice.taxAmount)}</dd></div>
        )}
        <div className="flex justify-between pt-2 border-t border-gray-300 text-base font-bold">
          <dt>Total</dt><dd style={{ color: accent }}>{amount(invoice.total)}</dd>
        </div>
      </dl>

      {invoice.notes && (
        <section className="mt-6">
          <p className="text-xs uppercase tracking-wide text-gray-500">Notes</p>
          <p className="whitespace-pre-line break-words">{invoice.notes}</p>
        </section>
      )}

      {business.paymentDetails && (
        <section className="mt-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Payment details</p>
          <p className="whitespace-pre-line break-words">{business.paymentDetails}</p>
        </section>
      )}
    </div>
  );
});

InvoiceDocument.displayName = 'InvoiceDocument';

export default InvoiceDocument;
