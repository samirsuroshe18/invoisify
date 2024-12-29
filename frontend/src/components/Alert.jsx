import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';

const Alert = ({ type = 'info', message = '', icon }) => {
    const alertClass = {
        info: 'alert-info',
        success: 'alert-success',
        warning: 'alert-warning',
        error: 'alert-error',
    }[type];

    const icons = {
        info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        success: 'M9 12l2 2 4-4m6 4a9 9 0 11-18 0 9 9 0 0118 0z',
        warning: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
        error: 'M12 8v4m0 4h.01M12 2a10 10 0 100 20 10 10 0 000-20z',
    };

    return (
        <div className="fixed top-20 right-5  ">
            <div role="alert" className={`alert ${alertClass} z-10`}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="h-6 w-6 shrink-0 stroke-current">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>{message}</span>
            </div>
        </div>

    );
};

export default Alert;
