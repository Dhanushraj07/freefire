
// FIX: Reverted to Firebase v8 (namespaced) imports to resolve module errors.
// The project seems to be using Firebase v8, where functions are not exported as named modules.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdlKJOSILuStChYEkcpqFgrl8KLl73slE",
  authDomain: "freefireroommatch-f7959.firebaseapp.com",
  projectId: "freefireroommatch-f7959",
  storageBucket: "freefireroommatch-f7959.firebasestorage.app",
  messagingSenderId: "1050111223319",
  appId: "1:1050111223319:web:ac864e1ec5088f216cde52",
  measurementId: "G-SYPRFNTEBS"
};

// Initialize Firebase
// FIX: Use the default export `firebase` to initialize the app with v8 syntax.
const app = firebase.initializeApp(firebaseConfig);

// Export Firebase services
// FIX: Use namespaced exports for auth, firestore, and providers from the v8 SDK.
export const auth = firebase.auth();
export const db = firebase.firestore();
export const googleProvider = new firebase.auth.GoogleAuthProvider();