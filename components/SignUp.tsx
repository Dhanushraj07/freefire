

import React, { useState } from 'react';
// FIX: Use a named import for `createUserWithEmailAndPassword` to resolve module resolution issues.
import { auth, db } from '../firebase';

interface SignUpProps {
  onSignupSuccess: (userId: string) => void;
  onSwitchToLogin: () => void;
}

const SignUp: React.FC<SignUpProps> = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [inGameId, setInGameId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (password.length < 6) {
        setError("Password should be at least 6 characters.");
        setIsLoading(false);
        return;
    }

    try {
      // FIX: Use the v8 namespaced `auth.createUserWithEmailAndPassword` method.
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error('User creation failed, please try again.');
      }

      // Create user profile in Firestore
      // FIX: Use v8 syntax `db.collection(...).doc(...).set(...)`
      await db.collection("users").doc(user.uid).set({
        name,
        inGameId,
        email,
        avatarUrl: `https://picsum.photos/seed/${user.uid}/100/100`,
        reputation: 5.0, // Starting reputation
        isVerified: false,
        matchesPlayed: 0,
        wins: 0,
      });

      onSignupSuccess(user.uid);
    } catch (err: any) {
      console.error("Error during sign up:", err);
      let message = 'Failed to create an account. Please try again.';
      if (err.code) {
          switch (err.code) {
              case 'auth/email-already-in-use':
                  message = 'This email is already registered. Please try logging in.';
                  break;
              case 'auth/weak-password':
                  message = 'Password is too weak. It must be at least 6 characters long.';
                  break;
              case 'auth/invalid-email':
                  message = 'The email address is not valid.';
                  break;
              case 'permission-denied':
                  message = 'Error: Permission denied to create user profile. Please check your Firestore security rules.';
                  break;
              default:
                  message = err.message;
                  break;
          }
      }
      setError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-dark-2 rounded-2xl shadow-lg p-8 space-y-6">
      <div className="text-center">
          <h1 className="text-4xl font-bold text-brand-primary tracking-wider">Create Account</h1>
          <p className="text-light-2 mt-2">Join SquadMatch today!</p>
      </div>
      
      <form onSubmit={handleSignUp} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-light-2 mb-2">Display Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
        </div>
        <div>
            <label className="block text-sm font-medium text-light-2 mb-2">In-Game ID</label>
            <input type="text" value={inGameId} onChange={e => setInGameId(e.target.value)} required className="w-full bg-dark-3 border border-dark-4 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
        </div>
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
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>
      <p className="text-center text-sm text-light-2">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="font-semibold text-brand-secondary hover:underline">
          Sign In
        </button>
      </p>
    </div>
  );
};

export default SignUp;