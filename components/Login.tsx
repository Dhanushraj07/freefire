

import React, { useState } from 'react';
// FIX: Removed v9 modular import for `signInWithEmailAndPassword`.
import { auth } from '../firebase';

interface LoginProps {
  onSwitchToSignup: () => void;
  onLoginSuccess: (userId: string) => void;
}

const Login: React.FC<LoginProps> = ({ onSwitchToSignup, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // FIX: Use the v8 namespaced `auth.signInWithEmailAndPassword` method.
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      if (userCredential.user) {
        onLoginSuccess(userCredential.user.uid);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-dark-2 rounded-2xl shadow-lg p-8 space-y-6">
      <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-primary tracking-wider">SquadMatch</h1>
          <p className="text-light-2 mt-2">Sign in to find your match</p>
      </div>
      
      <form onSubmit={handleAuthAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-light-2 mb-2">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-light-2 mb-2">Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button type="submit" disabled={isLoading} className="w-full bg-brand-primary hover:bg-opacity-90 text-white font-bold py-3 px-4 rounded-lg transition duration-300 disabled:opacity-50">
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-sm text-light-2">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignup} className="font-semibold text-brand-secondary hover:underline">
          Sign Up
        </button>
      </p>
    </div>
  );
};

export default Login;
