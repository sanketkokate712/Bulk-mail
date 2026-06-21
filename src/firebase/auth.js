import { auth } from './config';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const provider = new GoogleAuthProvider();

// Request permissions to send email on behalf of the user
provider.addScope('https://www.googleapis.com/auth/gmail.send');

// Optional: Request profile and email scopes explicitly (usually included by default)
provider.addScope('profile');
provider.addScope('email');

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    
    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;
    
    // The signed-in user info.
    const user = result.user;
    
    // Save token to session storage or local storage if needed to be passed to Gmail API service
    // Usually it's better to get fresh token if possible, but for simple app session storage works
    if (token) {
      sessionStorage.setItem('gmailAccessToken', token);
    }
    
    return { user, token };
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
    sessionStorage.removeItem('gmailAccessToken');
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};

export const subscribeToAuthChanges = (callback) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const getGmailAccessToken = () => {
  return sessionStorage.getItem('gmailAccessToken');
};
