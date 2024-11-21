import React from 'react';
import ReactDOM from 'react-dom/client';
import Login from './login';
import Signup from './signup';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // Import routing components

// Assuming you have a Home component for the root route
import Home from './Home'; 

// If you have CSS that needs to be applied globally, import it here
import './styles.css'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>   

    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));   

root.render(<App />);