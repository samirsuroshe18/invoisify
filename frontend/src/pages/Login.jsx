import React, {useState} from 'react';
import { Button, Form, Card } from 'react-bootstrap';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/authSlice';
import { useAlert } from '../hooks/useAlert';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [AlertComponent, showAlert] = useAlert();
  const dispatch = useDispatch();

  const loginUser = async (e)=>{
    e.preventDefault();

    if(!email || !password){
      showAlert("all fields are required",'info');
      return;
    }

    try {
        const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/api/v1/user/login`,
            {
              email: email,
              password: password
            },
            {
              withCredentials: true
            }
        );
        showAlert(response.data.message, 'success');
        dispatch(login(response.data.data));
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
    } catch (error) {
        showAlert(error.response?.data.message || error.message, 'error');
    }
};

  const googleLogin = async (token) => {

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/v1/oauth/google-login`,
        {
          name: token.name,
          email: token.email,
          profilePic: token.picture,
        },
        {
          withCredentials: true,
        }
      );
      showAlert(response.data.message, 'success');
      dispatch(login(response.data.data));
      navigate("/dashboard");
    } catch (error) {
      showAlert(error.response?.data.message || error.message, 'error');
    }
  };

  const handleSuccess = (response) => {
    const token = response.credential;
    const decoded = jwtDecode(token);
    googleLogin(decoded);
  };

  const handleError = (error) => {
    showAlert('Google Login Error:', error.message,'error');
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
      <AlertComponent/>
      <Card style={{ width: '400px' }} className="p-4 shadow-lg bg-white">
        <h3 className="text-center mb-4">Login</h3>
        
        <Form onSubmit={loginUser}>
          <Form.Group controlId="formBasicEmail" className='focus:bg-white'>
            <Form.Label>Email address</Form.Label>
            <Form.Control type="email" placeholder="Enter email" required onChange={(e)=>setEmail(e.target.value)}/>
          </Form.Group>

          <Form.Group controlId="formBasicPassword" className='focus:bg-white'>
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" placeholder="Password" required onChange={(e)=>setPassword(e.target.value)}/>
          </Form.Group>

          <Button variant="primary" type="submit" className="w-100 mt-3">
            Login
          </Button>
        </Form>

        <div className="text-center mt-4">
          <span>or</span>
        </div>

        
        <div className="d-flex justify-content-center mt-4">
        <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
      <GoogleLogin 
      onSuccess={handleSuccess}
      onError={handleError}/>
    </GoogleOAuthProvider>
        </div>

        <div className="text-center mt-2">
          <span> <Link to="/forgot-password">Forgot Password?</Link></span>
        </div>

        <div className="text-center mt-3">
          <span>Don't have an account? <Link to="/register">Sign Up</Link></span>
        </div>
      </Card>
    </div>
  );
};

export default Login;