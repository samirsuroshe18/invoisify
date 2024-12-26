import {
    createBrowserRouter,
    createRoutesFromElements,
    Route,
  } from "react-router-dom";
  import App from "../App.jsx";
  import NotFound from "../pages/NotFound.jsx";
  import Home from "../pages/Home.jsx";
  import Signup from "../pages/Signup.jsx";
  import Login from "../pages/Login.jsx";
  import Invoices from "../pages/Invoices.jsx"
  
  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<App />}>
          <Route path="/home" element={<Home />} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/invoices" element={<Invoices/>} />
        <Route path="*" element={<NotFound />} />
      </>
    )
  );
  
  export default router;
  