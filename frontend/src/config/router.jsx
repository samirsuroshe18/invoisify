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

import Register from "../pages/Register.jsx";
import InvoiceMaker from "../pages/InvoiceMaker.jsx";
import InvoicePreview from "../pages/InvoicePreview.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Features from "../components/Features.jsx";
import Contact from "../pages/Contact.jsx";
  
const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<App />}>
        <Route path="/home" element={<Home />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/forgot-password" element={<ForgotPassword/>} />
      <Route path="/invoice-maker" element={<InvoiceMaker />} />
      <Route path="/invoice-preview" element={<InvoicePreview />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/features" element={<Features/>} />
      <Route path="/contact" element={<Contact/>} />
      <Route path="*" element={<NotFound />} />
    </>
  )
);
  
export default router;