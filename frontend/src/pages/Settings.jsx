import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getBusiness, saveBusiness } from '../api/businessApi';
import { changePassword } from '../api/authApi';
import { errorMessage } from '../api/client';
import useToast from '../lib/useToast';
import { CURRENCIES } from '../lib/format';

const MAX_LOGO_BYTES = 1024 * 1024;
const LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MIN_PASSWORD = 8;

const logoProblem = (file) => {
  if (!LOGO_TYPES.includes(file.type)) return 'The logo must be a JPEG, PNG or WebP image';
  if (file.size > MAX_LOGO_BYTES) return 'The logo must be 1 MB or smaller';
  return '';
};

// the details that appear on every invoice
const BusinessForm = ({ canSave }) => {
  const toast = useToast();
  const fileInput = useRef(null);

  const [form, setForm] = useState(null);
  const [logoUrl, setLogoUrl] = useState('');
  const [logo, setLogo] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // what the server returned becomes what the form shows
  const show = (business) => {
    const { logoUrl: stored, ...fields } = business;
    // "complete" is the server's verdict, not a field of the form
    delete fields.complete;

    setForm({ ...fields, taxPercent: String(fields.taxPercent) });
    setLogoUrl(stored);
    setLogo(null);
    setRemoveLogo(false);
    if (fileInput.current) fileInput.current.value = '';
  };

  useEffect(() => {
    let cancelled = false;

    getBusiness()
      .then((business) => { if (!cancelled) show(business); })
      .catch((failure) => { if (!cancelled) setLoadError(errorMessage(failure)); });

    return () => { cancelled = true; };
  }, []);

  if (loadError) return <p role="alert" className="text-red-600">{loadError}</p>;
  if (!form) return <p className="text-gray-500" role="status">Loading…</p>;

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const chooseLogo = (event) => {
    const file = event.target.files[0] || null;
    const problem = file ? logoProblem(file) : '';

    setError(problem);
    setLogo(problem ? null : file);
    if (file && !problem) setRemoveLogo(false);
    if (problem) event.target.value = '';
  };

  const save = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.companyName.trim()) {
      setError('Company name is required');
      return;
    }

    setSaving(true);
    try {
      const res = await saveBusiness(form, logo, removeLogo);
      show(res.data.business);
      toast.success(res.message);
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="card p-5 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">Business profile</h2>
        <p className="text-sm text-gray-600">These details appear on your invoices. An invoice that was sent keeps the details it was sent with.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="companyName" className="label">Company name</label>
          <input id="companyName" name="companyName" type="text" maxLength={120} className="field" value={form.companyName} onChange={change} />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" className="field" value={form.email} onChange={change} />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone</label>
          <input id="phone" name="phone" type="tel" maxLength={30} className="field" value={form.phone} onChange={change} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="address" className="label">Address</label>
          <textarea id="address" name="address" rows="2" maxLength={300} className="field" value={form.address} onChange={change} />
        </div>
        <div>
          <label htmlFor="currency" className="label">Default currency</label>
          <select id="currency" name="currency" className="field" value={form.currency} onChange={change}>
            {CURRENCIES.map((currency) => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="taxPercent" className="label">Default tax %</label>
          <input id="taxPercent" name="taxPercent" type="number" min="0" max="100" step="0.01" inputMode="decimal" className="field" value={form.taxPercent} onChange={change} />
        </div>
        <div>
          <label htmlFor="accentColor" className="label">Accent colour</label>
          <input id="accentColor" name="accentColor" type="color" className="h-10 w-20 p-1 border border-gray-300 rounded-md bg-white" value={form.accentColor} onChange={change} />
        </div>
        <div>
          <label htmlFor="logo" className="label">Logo</label>
          {logoUrl && !removeLogo && !logo && (
            <div className="flex items-center gap-3 mb-2">
              <img src={logoUrl} alt="Current logo" className="h-12 max-w-[8rem] object-contain border border-gray-200 rounded" />
              <button type="button" onClick={() => setRemoveLogo(true)} className="text-sm text-red-600 hover:underline">Remove</button>
            </div>
          )}
          {removeLogo && <p className="text-sm text-gray-600 mb-2">The logo will be removed when you save. <button type="button" onClick={() => setRemoveLogo(false)} className="text-blue-600 hover:underline">Keep it</button></p>}
          <input id="logo" ref={fileInput} type="file" accept=".jpg,.jpeg,.png,.webp" onChange={chooseLogo} className="block w-full text-sm text-gray-600" />
          <p className="text-xs text-gray-500 mt-1">Optional. JPEG, PNG or WebP, up to 1 MB.</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="paymentDetails" className="label">Payment details</label>
          <textarea id="paymentDetails" name="paymentDetails" rows="2" maxLength={500} className="field" value={form.paymentDetails} onChange={change} placeholder="Bank account, UPI id: shown at the bottom of an invoice" />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {!canSave && <p className="text-sm text-amber-700">Verify your email to save your profile.</p>}

      <button type="submit" disabled={saving || !canSave} className="btn-primary">{saving ? 'Saving…' : 'Save profile'}</button>
    </form>
  );
};

const PasswordForm = () => {
  const toast = useToast();
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const save = async (event) => {
    event.preventDefault();
    setError('');

    if (form.next.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters`);
      return;
    }

    if (form.next !== form.confirm) {
      setError('The two new passwords are not the same');
      return;
    }

    setSaving(true);
    try {
      const res = await changePassword(form.current, form.next);
      toast.success(`${res.message}. Other devices were logged out.`);
      setForm({ current: '', next: '', confirm: '' });
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} noValidate className="card p-5 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Change password</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="current" className="label">Current password</label>
          <input id="current" name="current" type="password" autoComplete="current-password" className="field" value={form.current} onChange={change} />
        </div>
        <div>
          <label htmlFor="next" className="label">New password</label>
          <input id="next" name="next" type="password" autoComplete="new-password" className="field" value={form.next} onChange={change} />
        </div>
        <div>
          <label htmlFor="confirm" className="label">New password again</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" className="field" value={form.confirm} onChange={change} />
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={saving || !form.current || !form.next} className="btn-primary">{saving ? 'Saving…' : 'Change password'}</button>
    </form>
  );
};

const Settings = () => {
  const user = useSelector((state) => state.auth.user);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-600 break-words">{user.name} • {user.email}</p>
      </div>

      <BusinessForm canSave={user.isVerified} />

      {user.isDemo
        ? <p className="card p-5 text-sm text-gray-600">The demo account keeps its password, so it stays open to everyone.</p>
        : <PasswordForm />}
    </div>
  );
};

export default Settings;
