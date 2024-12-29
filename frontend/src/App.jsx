import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import axios from 'axios'
import { Link, useNavigate } from "react-router-dom";
import {useDispatch} from "react-redux";
import { login } from './redux/slices/authSlice';
import { useAlert } from './hooks/useAlert';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [AlertComponent, showAlert] = useAlert();

  useEffect(() => {
    axios
      .get(
        `${import.meta.env.VITE_BASE_URL}/api/v1/user/get-current-user`,
        {
          withCredentials: true,
        }
      )
      .then((response) => {
        console.log(response.data.data);
        dispatch(login(response.data.data));
        showAlert(response.data.message, 'success');
        setIsLoggedIn(true);
      })
      .catch((error) => {
        console.log(error);
        showAlert(error?.response?.data.message || error.message, 'error');
        setIsLoggedIn(false);
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
    <AlertComponent/>
      <Home/>
    </>
  )
}

export default App
