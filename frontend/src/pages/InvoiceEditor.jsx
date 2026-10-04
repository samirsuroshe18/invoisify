import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getBusiness } from '../api/businessApi';
import { createInvoice, getInvoice, updateInvoice } from '../api/invoiceApi';
import { errorMessage, statusOf as httpStatus } from '../api/client';
import InvoiceDocument from '../components/InvoiceDocument';
import useToast from '../lib/useToast';
import { addDays, CURRENCIES, localToday, previewTotals } from '../lib/format';

const MAX_ITEMS = 50;
const DAYS_TO_PAY = 14;

const emptyItem = () => ({ description: '', quantity: '1', rate: '' });

// what the form holds; numbers stay text while they are typed
const blank = (business) => ({
  customer: { name: '', email: '', address: '' },
  issueDate: localToday(),
  dueDate: addDays(localToday(), DAYS_TO_PAY),
  currency: business.currency,
  items: [emptyItem()],
  discountPercent: '0',
  taxPercent: String(business.taxPercent),
  notes: '',
});

const fromInvoice = (invoice) => ({
  customer: { ...invoice.customer },
  issueDate: invoice.issueDate,
  dueDate: invoice.dueDate,
  currency: invoice.currency,
  items: invoice.items.map((item) => ({ description: item.description, quantity: String(item.quantity), rate: String(item.rate) })),
  discountPercent: String(invoice.discountPercent),
  taxPercent: String(invoice.taxPercent),
  notes: invoice.notes || '',
});

// what the form can check itself; the server checks everything again
const problemIn = (form) => {
  if (!form.customer.name.trim()) return 'Customer name is required';
  if (!form.issueDate || !form.dueDate) return 'Give the issue date and the due date';
  if (form.dueDate < form.issueDate) return 'The due date cannot be before the issue date';

  const position = form.items.findIndex((item) => !item.description.trim() || !(Number(item.quantity) > 0) || item.rate === '' || !(Number(item.rate) >= 0));
  if (position >= 0) return `Item ${position + 1}: give a description, a quantity above 0 and a rate`;

  return '';
};

// One form for a new invoice and for editing a draft, with the invoice as it will
// look beside it (under it on a phone).
const InvoiceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useSelector((state) => state.auth.user);

  const [business, setBusiness] = useState(null);
  const [form, setForm] = useState(null);
  const [number, setNumber] = useState('');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setForm(null);
    setLoadError('');

    Promise.all([getBusiness(), id ? getInvoice(id) : null])
      .then(([profile, invoice]) => {
        if (cancelled) return;

        if (invoice && invoice.status !== 'draft') {
          setLoadError('Only a draft can be edited. Move the invoice back to draft first.');
          return;
        }

        setBusiness(profile);
        setNumber(invoice?.number || '');
        setForm(invoice ? fromInvoice(invoice) : blank(profile));
      })
      .catch((failure) => {
        if (!cancelled) setLoadError(httpStatus(failure) === 404 ? 'This invoice does not exist.' : errorMessage(failure));
      });

    return () => { cancelled = true; };
  }, [id]);

  const preview = useMemo(() => (form && business ? {
    number,
    status: 'draft',
    business,
    customer: form.customer,
    issueDate: form.issueDate,
    dueDate: form.dueDate,
    currency: form.currency,
    notes: form.notes,
    discountPercent: Number(form.discountPercent) || 0,
    taxPercent: Number(form.taxPercent) || 0,
    ...previewTotals(form),
  } : null), [form, business, number]);

  if (loadError) {
    return (
      <div className="card p-8 text-center">
        <p role="alert" className="text-red-600">{loadError}</p>
        <Link to={id ? `/invoices/${id}` : '/invoices'} className="btn-quiet mt-4">Back</Link>
      </div>
    );
  }

  if (!form) return <p className="text-gray-500" role="status">Loading…</p>;

  if (!business.complete) {
    return (
      <div className="card p-8 text-center">
        <h1 className="text-xl font-semibold text-gray-800">First, your business profile</h1>
        <p className="text-gray-600 mt-2">An invoice says who it is from. Fill in your company name and details once, and they appear on every invoice.</p>
        <Link to="/settings" className="btn-primary mt-4">Open settings</Link>
      </div>
    );
  }

  // a change may be the correction of what the message is about, so the message goes
  const set = (changes) => {
    setError('');
    setForm((current) => ({ ...current, ...changes }));
  };
  const setCustomer = (event) => set({ customer: { ...form.customer, [event.target.name]: event.target.value } });
  const setItem = (index, field, value) => set({ items: form.items.map((item, position) => (position === index ? { ...item, [field]: value } : item)) });
  const addItem = () => set({ items: [...form.items, emptyItem()] });
  const removeItem = (index) => set({ items: form.items.filter((_, position) => position !== index) });

  const save = async (event) => {
    event.preventDefault();

    const problem = problemIn(form);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const res = id ? await updateInvoice(id, form) : await createInvoice(form);
      toast.success(res.message);
      navigate(`/invoices/${res.data.invoice._id}`);
    } catch (failure) {
      setError(errorMessage(failure));
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">{id ? `Edit ${number}` : 'New invoice'}</h1>
        <Link to={id ? `/invoices/${id}` : '/invoices'} className="btn-quiet">Cancel</Link>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <form onSubmit={save} noValidate className="card p-5 space-y-6">
          <fieldset className="space-y-3">
            <legend className="font-semibold text-gray-800 mb-1">Customer</legend>
            <div>
              <label htmlFor="customer-name" className="label">Name</label>
              <input id="customer-name" name="name" type="text" maxLength={120} className="field" value={form.customer.name} onChange={setCustomer} />
            </div>
            <div>
              <label htmlFor="customer-email" className="label">Email <span className="font-normal text-gray-500">(needed to send the invoice)</span></label>
              <input id="customer-email" name="email" type="email" className="field" value={form.customer.email} onChange={setCustomer} />
            </div>
            <div>
              <label htmlFor="customer-address" className="label">Address</label>
              <textarea id="customer-address" name="address" rows="2" maxLength={300} className="field" value={form.customer.address} onChange={setCustomer} />
            </div>
          </fieldset>

          <fieldset className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <legend className="font-semibold text-gray-800 mb-1">Dates and currency</legend>
            <div>
              <label htmlFor="issueDate" className="label">Issue date</label>
              <input id="issueDate" type="date" className="field" value={form.issueDate} onChange={(e) => set({ issueDate: e.target.value })} />
            </div>
            <div>
              <label htmlFor="dueDate" className="label">Due date</label>
              <input id="dueDate" type="date" min={form.issueDate} className="field" value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
            </div>
            <div>
              <label htmlFor="currency" className="label">Currency</label>
              <select id="currency" className="field" value={form.currency} onChange={(e) => set({ currency: e.target.value })}>
                {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="font-semibold text-gray-800 mb-1">Items</legend>
            {form.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-12 sm:col-span-6">
                  <label htmlFor={`item-${index}-description`} className="label">Description</label>
                  <input id={`item-${index}-description`} type="text" maxLength={200} className="field" value={item.description} onChange={(e) => setItem(index, 'description', e.target.value)} />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label htmlFor={`item-${index}-quantity`} className="label">Qty</label>
                  <input id={`item-${index}-quantity`} type="number" min="0" step="any" inputMode="decimal" className="field" value={item.quantity} onChange={(e) => setItem(index, 'quantity', e.target.value)} />
                </div>
                <div className="col-span-5 sm:col-span-3">
                  <label htmlFor={`item-${index}-rate`} className="label">Rate</label>
                  <input id={`item-${index}-rate`} type="number" min="0" step="0.01" inputMode="decimal" className="field" value={item.rate} onChange={(e) => setItem(index, 'rate', e.target.value)} />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <button type="button" onClick={() => removeItem(index)} disabled={form.items.length === 1} aria-label={`Remove item ${index + 1}`} className="btn-quiet w-full px-0">✕</button>
                </div>
              </div>
            ))}
            <button type="button" onClick={addItem} disabled={form.items.length >= MAX_ITEMS} className="btn-quiet">Add an item</button>
          </fieldset>

          <fieldset className="grid grid-cols-2 gap-3">
            <legend className="font-semibold text-gray-800 mb-1">Discount and tax</legend>
            <div>
              <label htmlFor="discountPercent" className="label">Discount %</label>
              <input id="discountPercent" type="number" min="0" max="100" step="0.01" inputMode="decimal" className="field" value={form.discountPercent} onChange={(e) => set({ discountPercent: e.target.value })} />
            </div>
            <div>
              <label htmlFor="taxPercent" className="label">Tax %</label>
              <input id="taxPercent" type="number" min="0" max="100" step="0.01" inputMode="decimal" className="field" value={form.taxPercent} onChange={(e) => set({ taxPercent: e.target.value })} />
            </div>
          </fieldset>

          <div>
            <label htmlFor="notes" className="label">Notes</label>
            <textarea id="notes" rows="3" maxLength={1000} className="field" value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Shown at the bottom of the invoice" />
          </div>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {!user.isVerified && <p className="text-sm text-amber-700">Verify your email to save invoices.</p>}

          <button type="submit" disabled={saving || !user.isVerified} className="btn-primary">
            {saving ? 'Saving…' : (id ? 'Save changes' : 'Save as draft')}
          </button>
        </form>

        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Preview</p>
          <InvoiceDocument invoice={preview} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceEditor;
