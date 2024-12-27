import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
  } from "react-router-dom";
  import App from "../App.jsx";
  import NotFound from "../pages/NotFound.jsx";
  import Home from "../pages/Home.jsx";
  import ForgotPassword from "../pages/ForgotPassword.jsx";
  import Login from "../pages/Login.jsx";
  import Invoices from "../pages/Invoices.jsx"
  import Register from "../pages/Register.jsx";
  import InvoiceMaker from "../pages/invoicemaker.jsx";
  import InvoiceDesigner from "../components/InvoiceDesigner.jsx";
  import IssueInvoice from "../components/IssueInvoice.jsx";
  
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<App />}>
          <Route path="/home" element={<Home />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/invoices" element={<Invoices/>} />
        <Route path="/forgot-password" element={<ForgotPassword/>} />
        
        <Route path="*" element={<NotFound />} />
        <Route path="/invoice-maker" element={<InvoiceMaker />} />
        <Route path="/invoice-designer" element={<InvoiceDesigner />} />
        <Route path="/issue" element={<IssueInvoice />} />
      </>
    )
  );
  
  export default router;
  