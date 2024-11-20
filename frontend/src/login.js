import React, { useState } from 'react';
import app from './firebase'; 
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth(app);

function   
 Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();   
 
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in successfully!');
    } catch (error) {
      console.error('Error signing in:', error);
      // Handle sign-in error (e.g., display error message)
    }
  };

  return (
    <form onLogIn={handleLogIn}>
      <div>
        <label htmlFor="email">Email:</label>
        <input 
          type="email" 
          id="email" 
          value={email} 
          onChange={(e)   => setEmail(e.target.value)} 
        />
      </div>
      <div>
        <label htmlFor="password">Password:</label>
        <input 
          type="password" 
          id="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
      </div>   

      <button type="login">Login</button>
    </form>
  );
}

export default Login;