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
import InvoiceMaker from "../pages/InvoiceMaker.jsx";
import InvoicePreview from "../pages/InvoicePreview.jsx";
import Dashboard from "../pages/Dashboard.jsx";
  
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
        <Route path="/invoice-preview" element={<InvoicePreview />} />
        <Route path="/Dashboard" element={<Dashboard />} />
      </>
    )
  );
  
  export default router;
  
=======

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />}>
        <Route path="/home" element={<Home />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/invoices" element={<Invoices />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="*" element={<NotFound />} />
      <Route path="/invoice-maker" element={<InvoiceMaker />} />
      <Route path="/invoice-preview" element={<InvoicePreview />} />
    </>
  )
);

export default router;
>>>>>>> 66872817022b06d4d1c8ed98ea12de628e7f9a29
  