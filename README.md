# Invoisify

## Overview
**Invoisify** is a web application designed to simplify invoicing for businesses and freelancers. With Invoisify, users can easily create, manage, and track invoices while maintaining a professional and efficient workflow. The application provides dynamic invoice templates, real-time tracking, and secure user authentication to ensure a seamless experience.

---

## Features
- **Dynamic Invoice Creation**: Generate professional invoices with customizable templates.
- **Invoice Management**: Track, update, and manage all invoices in one place.
- **Secure Authentication**: User registration and login with JWT-based authentication.
- **Real-Time Notifications**: Get notified about invoice status updates.
- **Responsive Design**: Fully optimized for desktop and mobile devices.

---

## Tech Stack
### Frontend:
- **React.js**: For building the user interface.
- **Tailwind CSS**: For responsive and modern styling.

### Backend:
- **Node.js**: Server-side logic and API handling.
- **Express.js**: Backend framework for building RESTful APIs.

### Database:
- **MongoDB**: For storing user data and invoices.

### Additional Tools:
- **JWT**: For secure authentication.
- **Mongoose**: For database modeling and interaction.
- **Postman**: For API testing.
- **Cloudinary**: For managing invoice-related image assets (e.g., logos).

---

## Installation and Setup

### Prerequisites
- Node.js and npm installed on your machine.
- MongoDB database (local or hosted instance).

### Steps to Run Locally
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/TanishqMSD/invoisify.git
   cd invoisify
   ```

2. **Install Dependencies:**
   ```bash
   cd backend
   npm install
   cd frontend
   npm install
   cd ..
   ```

3. **Set Up Environment Variables:**
   Create a `.env` file in the root directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. **Start the Application:**
   ```bash
   # Start the backend server
   npm run dev

   # In a separate terminal, start the frontend
   cd frontend
   npm start
   ```

5. **Access the App:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Folder Structure
```
invoisify/
├── frontend/               # React frontend
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Page components
│   │   ├── utils/          # Utility functions
│   │   ├── context/        # Context API for state management
│   │   └── App.js          # Main app component
│   └── package.json        # Frontend dependencies
├── backend/                # Node.js backend
│   ├── controllers/        # Route controllers
│   ├── middlewares/        # Custom middleware (e.g., auth)
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── server.js           # Entry point for the server
│   └── package.json        # Backend dependencies
├── .env                    # Environment variables
├── package.json            # Project dependencies
└── README.md               # Project documentation
```

---

## API Endpoints
| Method | Endpoint            | Description                       |
|--------|---------------------|-----------------------------------|
| POST   | /api/users/register | Register a new user               |
| POST   | /api/users/login    | Authenticate user and return token|
| GET    | /api/invoices       | Get all invoices for the user     |
| POST   | /api/invoices       | Create a new invoice              |
| PUT    | /api/invoices/:id   | Update an invoice                 |
| DELETE | /api/invoices/:id   | Delete an invoice                 |

---


## Future Enhancements
- Add payment integration (e.g., Stripe, PayPal).
- Advanced analytics for tracking invoice performance.
- Multi-language support for global users.

---

## Contribution Guidelines
We welcome contributions from the community! To contribute:
1. Fork the repository.
2. Create a new branch for your feature/bugfix.
3. Submit a pull request with detailed comments about your changes.

---



## Contact
If you have any questions or suggestions, feel free to reach out:
- **Email**: tanishqkulkarni18@gmail.com
- **Discord**: tanishq7781

---

Thank you!

