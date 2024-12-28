import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Login from './pages/Login'
import axios from 'axios'
import { Link, useNavigate } from "react-router-dom";
import {useDispatch} from "react-redux";
import { login } from './redux/slices/authSlice';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
        alert(response.data.message);
        setIsLoggedIn(true);
      })
      .catch((error) => {
        console.log(error);
        alert(error?.response?.data.message || error.message);
        setIsLoggedIn(false);
        navigate("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Home/>
    </>
  )
}

export default App
