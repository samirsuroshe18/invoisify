import React, { useState } from 'react';
import { Button, Form, Card } from 'react-bootstrap';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useDispatch } from 'react-redux';
import { useAlert } from '../hooks/useAlert';

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState()
    const [confirmPassword, setConfirmPassword] = useState();
    const [name ,setName] = useState();
    const [AlertComponent, showAlert] = useAlert();
    const dispatch = useDispatch();

    const registerUser = async (e)=>{
        e.preventDefault();

        if(password !== confirmPassword){
            showAlert('Passwords do not match', 'warning');
            return;
        }
        if(!email || !name || !password){
            showAlert('Please fill all the fields', 'error');
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BASE_URL}/api/v1/user/register`,
                {
                    name: name,
                    email: email,
                    password: password
                },
                {
                    withCredentials: true
                }
            );
            showAlert(response.data.message, 'success');
            navigate("/login");
            dispatch(login(response.data.data));
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
            showAlert(response.data.message,'warning');
            dispatch(login(response.data.data));
            navigate("/dashboard");
        } catch (error) {
            showAlert(error.response?.data.message || error.message,'error');
        }
    };

    const handleSuccess = (response) => {
        const token = response.credential;
        const decoded = jwtDecode(token);
        googleLogin(decoded);
    };

    const handleError = (error) => {
        showAlert('Google Login Error:'|| error.message,'error');
    };

    return (
        <div className='bg-gray-900'>
            <AlertComponent />
            <div className="d-flex justify-content-center bg-gray-800 align-items-center min-vh-100 bg-light gap-2">
                <Card style={{ width: '400px' }} className="p-4 shadow-lg py-4">
                    <h3 className="text-center mb-4">Create an Account</h3>

                    <Form onSubmit={registerUser}>
                        <Form.Group controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control type="email" onChange={(e)=>setEmail(e.target.value)} placeholder="Enter email"  />
                        </Form.Group>

                        
                        <Form.Group controlId="formBasicName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" onChange={(e)=>setName(e.target.value)} placeholder="Enter Name"  />
                        </Form.Group>

                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="Password" 
                            onChange={(e)=>setPassword(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group controlId="formConfirmPassword">
                            <Form.Label>Confirm Password</Form.Label>
                            <Form.Control type="password" placeholder="Re-enter your password"  onChange={(e)=>setConfirmPassword(e.target.value)} />
                        </Form.Group>

                        <Button variant="primary" type="submit" className="w-100 mt-3">
                            Register Account
                        </Button>
                    </Form>

                    <div className="text-center mt-4">
                        <span>or</span>
                    </div>

                    <div className="d-flex justify-content-center mt-4">
                        <GoogleOAuthProvider clientId={import.meta.env.VITE_CLIENT_ID}>
                            <GoogleLogin
                                onSuccess={handleSuccess}
                                onError={handleError} />
                        </GoogleOAuthProvider>
                    </div>

                    <div className="text-center mt-3">
                        <span>Already have an Account? <Link to="/login">Login</Link></span>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default Register;