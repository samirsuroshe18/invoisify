import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { changeStatus, deleteInvoice, duplicateInvoice, getInvoice } from '../api/invoiceApi';
import { errorMessage, statusOf as httpStatus } from '../api/client';
import InvoiceDocument from '../components/InvoiceDocument';
import StatusBadge from '../components/StatusBadge';
import useToast from '../lib/useToast';
import { localToday } from '../lib/format';

// One invoice: how it looks, where it stands and what can be done with it
const InvoiceView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const user = useSelector((state) => state.auth.user);
  const paper = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [paying, setPaying] = useState(false);
  const [paidDate, setPaidDate] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      setInvoice(await getInvoice(id));
    } catch (failure) {
      setInvoice(null);
      setLoadError(httpStatus(failure) === 404 ? 'This invoice does not exist.' : errorMessage(failure));
    }
  }, [id]);

  useEffect(() => {
    setInvoice(null);
    load();
  }, [load]);

  // runs one action; a refusal is shown and the invoice is read again, in case it changed
  const run = async (name, action) => {
    setBusy(name);
    try {
      const res = await action();
      toast.success(res.message);
      return res;
    } catch (failure) {
      toast.error(failure);
      if (httpStatus(failure) === 409) await load();
      return null;
    } finally {
      setBusy('');
    }
  };

  const move = async (status, date) => {
    const res = await run(status, () => changeStatus(id, status, date));
    if (res) {
      setInvoice(res.data.invoice);
      setPaying(false);
    }
  };

  // The latest day an invoice can have been paid on is today, here. Where the business
  // is, it may be a day ahead already, so an invoice issued "today" there is not refused.
  const latestPaidDay = () => (invoice.issueDate > localToday() ? invoice.issueDate : localToday());

  const startPaying = () => {
    setPaidDate(latestPaidDay());
    setPaying(true);
  };

  const duplicate = async () => {
    const res = await run('duplicate', () => duplicateInvoice(id));
    if (res) navigate(`/invoices/${res.data.invoice._id}/edit`);
  };

  const remove = async () => {
    if (!window.confirm(`Delete invoice ${invoice.number}? This cannot be undone.`)) return;

    const res = await run('delete', () => deleteInvoice(id));
    if (res) navigate('/invoices');
  };

  const download = async () => {
    setBusy('pdf');
    try {
      // the PDF maker is large, so it is fetched only when a PDF is asked for
      const { default: html2pdf } = await import('html2pdf.js');

      await html2pdf()
        .from(paper.current)
        .set({
          filename: `${invoice.number}.pdf`,
          margin: 8,
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .save();
    } catch {
      toast.error('The PDF could not be made. Please try again.');
    } finally {
      setBusy('');
    }
  };

  if (loadError) {
    return (
      <div className="card p-8 text-center">
        <p role="alert" className="text-red-600">{loadError}</p>
        <Link to="/invoices" className="btn-quiet mt-4">Back to invoices</Link>
      </div>
    );
  }

  if (!invoice) return <p className="text-gray-500" role="status">Loading…</p>;

  const { status } = invoice;
  const can = user.isVerified && !busy;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/invoices" className="text-sm text-blue-600 hover:underline">← Invoices</Link>
        <h1 className="text-2xl font-bold text-gray-800">{invoice.number}</h1>
        <StatusBadge invoice={invoice} />
      </div>

      <div className="card p-4 flex flex-wrap gap-2">
        <button onClick={download} disabled={Boolean(busy)} className="btn-primary">{busy === 'pdf' ? 'Making the PDF…' : 'Download PDF'}</button>

        {status === 'draft' && (
          <>
            <Link to={`/invoices/${id}/edit`} className="btn-quiet">Edit</Link>
            <button onClick={() => move('sent')} disabled={!can} className="btn-quiet">Mark as sent</button>
          </>
        )}

        {status === 'sent' && (
          <>
            <button onClick={startPaying} disabled={!can} className="btn-quiet">Mark as paid</button>
            <button onClick={() => move('draft')} disabled={!can} className="btn-quiet">Back to draft</button>
          </>
        )}

        {status === 'paid' && <button onClick={() => move('sent')} disabled={!can} className="btn-quiet">Mark as unpaid</button>}

        <button onClick={duplicate} disabled={!can} className="btn-quiet">Duplicate</button>
        {status !== 'paid' && <button onClick={remove} disabled={!can} className="btn-danger">Delete</button>}
      </div>

      {paying && (
        <form
          onSubmit={(event) => { event.preventDefault(); move('paid', paidDate); }}
          className="card p-4 flex flex-wrap items-end gap-3"
        >
          <div>
            <label htmlFor="paidDate" className="label">Paid on</label>
            <input id="paidDate" type="date" min={invoice.issueDate} max={latestPaidDay()} className="field" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} />
          </div>
          <button type="submit" disabled={!can || !paidDate} className="btn-primary">Confirm payment</button>
          <button type="button" onClick={() => setPaying(false)} className="btn-quiet">Cancel</button>
        </form>
      )}

      {!user.isVerified && <p className="text-sm text-amber-700">Verify your email to change invoices.</p>}

      <div className="max-w-3xl">
        <InvoiceDocument ref={paper} invoice={invoice} />
      </div>
    </div>
  );
};

export default InvoiceView;
