import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { GuestOnly, RequireLogin, SessionRoot } from "../components/Session.jsx";
import AppShell from "../components/AppShell.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import VerifyEmail from "../pages/VerifyEmail.jsx";
import PublicInvoice from "../pages/PublicInvoice.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Invoices from "../pages/Invoices.jsx";
import InvoiceEditor from "../pages/InvoiceEditor.jsx";
import InvoiceView from "../pages/InvoiceView.jsx";
import Settings from "../pages/Settings.jsx";
import NotFound from "../pages/NotFound.jsx";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<SessionRoot />}>
      {/* open to everyone */}
      <Route path="/" element={<Home />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* the page a customer opens from the link of an invoice */}
      <Route path="/i/:code" element={<PublicInvoice />} />

      {/* for visitors who are not logged in */}
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* behind the login */}
      <Route element={<RequireLogin />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceEditor />} />
          <Route path="/invoices/:id" element={<InvoiceView />} />
          <Route path="/invoices/:id/edit" element={<InvoiceEditor />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

export default router;
