import React, { useState } from 'react';
import { Button, Form, Card } from 'react-bootstrap';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const Register = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState();
    const [password, setPassword] = useState()
    const [confirmPassword, setConfirmPassword] = useState();
    const [name ,setName] = useState();

    const registerUser = async (e)=>{
        e.preventDefault();

        if(password !== confirmPassword){
            alert('Password does not match');
            return;
        }
        if(!email || !name || !password){
            alert("all fields are required");
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
            alert(response.data.message);
        } catch (error) {
            alert(error.response?.data.message || error.message);
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
            alert(response.data.message);
            navigate("/");
        } catch (error) {
            alert(error.response?.data.message || error.message);
        }
    };

    const handleSuccess = (response) => {
        const token = response.credential;
        const decoded = jwtDecode(token);
        googleLogin(decoded);
    };

    const handleError = (error) => {
        alert('Google Login Error:', error.message);
    };

    return (
        <div className='bg-gray-900'>
            <div className="d-flex justify-content-center bg-gray-800 align-items-center min-vh-100 bg-light gap-2">
                <Card style={{ width: '400px' }} className="p-4 shadow-lg py-4">
                    <h3 className="text-center mb-4">Create an Account</h3>

                    <Form onSubmit={registerUser}>
                        <Form.Group controlId="formBasicEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control type="email" onChange={(e)=>setEmail(e.target.value)} placeholder="Enter email" required />
                        </Form.Group>

                        
                        <Form.Group controlId="formBasicName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control type="text" onChange={(e)=>setName(e.target.value)} placeholder="Enamenter Name" required />
                        </Form.Group>

                        <Form.Group controlId="formBasicPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control type="password" placeholder="Password" required
                            onChange={(e)=>setPassword(e.target.value)}
                            />
                        </Form.Group>

                        <Form.Group controlId="formConfirmPassword">
                            <Form.Label>Confirm Password</Form.Label>
                            <Form.Control type="password" placeholder="Re-enter your password" required onChange={(e)=>setConfirmPassword(e.target.value)} />
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