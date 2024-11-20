import React, { useState } from 'react';
import app from './firebase'; 
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const auth = getAuth(app);

function   
 Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();   
 // Prevent default form submission behavior   

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Handle successful signup (e.g., redirect to home page)
      console.log('User signed up successfully!');
    } catch (error) {
      console.error('Error signing up:', error);
      // Handle signup error (e.g., display error message)
    }
  };

  return (
    <form onSubmit={handleSubmit}>
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

      <button type="submit">Sign Up</button>
    </form>
  );
}

export default   
 Signup;