import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';
import { User } from '../types';
import { db } from '../firebase';
// FIX: Removed v9 modular imports; using v8 namespaced API instead.

interface AuthPageProps {
    onAuthSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
    const [isLogin, setIsLogin] = useState(true);

    const handleAuthSuccess = async (userId: string) => {
        // FIX: Use v8 namespaced API for consistency and to prevent errors.
        const userDocRef = db.collection("users").doc(userId);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            onAuthSuccess({ id: userDoc.id, ...userDoc.data()} as User);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-1 p-4">
            {isLogin ? (
                <Login onSwitchToSignup={() => setIsLogin(false)} onLoginSuccess={handleAuthSuccess} />
            ) : (
                <SignUp onSignupSuccess={handleAuthSuccess} onSwitchToLogin={() => setIsLogin(true)} />
            )}
        </div>
    );
};

export default AuthPage;