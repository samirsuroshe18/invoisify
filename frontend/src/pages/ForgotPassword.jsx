import axios from 'axios';
import React, { useState } from 'react';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Handle forgot password logic here
        console.log('Email:', email);
        try {
            const response = await axios.post(
                 `${import.meta.env.VITE_BASE_URL}/api/v1/user/forgot-password`, 
                 { email }
                );

            alert(response.data.message)
        } catch (error) {
            alert(error.response.data.message || error.message)
        }
    };
    

    return (
        <div className="forgot-password-container">
            <h2>Forgot Password</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Submit</button>
            </form>
        </div>
    );
};

export default ForgotPassword;