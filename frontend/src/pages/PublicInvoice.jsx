import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicInvoice } from '../api/invoiceApi';
import { errorMessage, statusOf as httpStatus } from '../api/client';
import InvoiceDocument from '../components/InvoiceDocument';
import StatusBadge from '../components/StatusBadge';
import { downloadPdf } from '../lib/pdf';
import { dayLabel } from '../lib/format';
import logo from '../assets/logo.svg';

// The page a customer opens from the link in the email: one invoice, to read and to
// download. No login, and nothing else of the business that sent it.
const PublicInvoice = () => {
  const { code } = useParams();
  const paper = useRef(null);

  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [making, setMaking] = useState(false);
  const [pdfError, setPdfError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setInvoice(null);
    setError('');

    getPublicInvoice(code)
      .then((answer) => {
        if (cancelled) return;
        setInvoice(answer);
        document.title = `Invoice ${answer.number} from ${answer.business.companyName}`;
      })
      .catch((failure) => {
        if (cancelled) return;
        setError(httpStatus(failure) === 404
          ? 'This invoice is not available. The link may have been withdrawn; ask the sender for a new one.'
          : errorMessage(failure));
      });

    return () => {
      cancelled = true;
      document.title = 'Invoisify';
    };
  }, [code]);

  const download = async () => {
    setMaking(true);
    setPdfError('');
    try {
      await downloadPdf(paper.current, invoice.number);
    } catch {
      setPdfError('The PDF could not be made. Please try again.');
    } finally {
      setMaking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img className="h-8 w-8" src={logo} alt="" />
            <span className="text-xl font-semibold text-gray-800">Invoisify</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 space-y-5">
        {error && <p role="alert" className="card p-8 text-center text-gray-700">{error}</p>}
        {!error && !invoice && <p className="text-gray-500" role="status">Loading the invoice…</p>}

        {invoice?.demo && (
          <p role="note" className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg p-4 text-sm">
            This is a demo invoice, made with Invoisify&apos;s public demo account, which anyone can use. It is not a real request for payment.
          </p>
        )}

        {invoice && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-800">Invoice {invoice.number}</h1>
                  <StatusBadge invoice={invoice} />
                </div>
                <p className="text-gray-600 break-words">
                  From {invoice.business.companyName}
                  {invoice.status === 'paid' ? `, paid on ${dayLabel(invoice.paidDate)}` : `, due on ${dayLabel(invoice.dueDate)}`}
                </p>
              </div>
              <button onClick={download} disabled={making} className="btn-primary">{making ? 'Making the PDF…' : 'Download PDF'}</button>
            </div>

            {pdfError && <p role="alert" className="text-sm text-red-600">{pdfError}</p>}

            <InvoiceDocument ref={paper} invoice={invoice} />
          </>
        )}
      </main>

      <footer className="text-center text-sm text-gray-500 py-6">
        Made with <Link to="/" className="text-blue-600 hover:underline">Invoisify</Link>
      </footer>
    </div>
  );
};

export default PublicInvoice;
