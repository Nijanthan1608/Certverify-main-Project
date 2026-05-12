import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

// Create a global "Context" that acts as a central store for authentication data.
// In React, Context allows us to pass data like `user` directly down to any component
// without having to manually pass it as props through every layer of the app.
const AuthContext = createContext(null);

// The AuthProvider wraps our entire application (see App.js)
// and handles all the complex logic of logging in, registering, and remembering the user.
export const AuthProvider = ({ children }) => {
  // `user` holds the current logged-in user's info (name, email, role, etc.). If null, nobody is logged in.
  const [user, setUser] = useState(null);
  
  // `loading` is true while we ask the server "Is this person still logged in?"
  // We use this to show the LoadingScreen before the app fully loads.
  const [loading, setLoading] = useState(true);

  // useCallback ensures this function isn't recreated on every re-render, optimizing performance.
  const loadUser = useCallback(async () => {
    // Check if the browser has a saved JWT security token from a previous visit
    const token = localStorage.getItem('cv_token');
    
    // If no token exists, they aren't logged in. Stop loading.
    if (!token) { setLoading(false); return; }
    
    try {
      // Ask the server to verify the token and return the user's profile
      const { data } = await authService.getMe();
      setUser(data.user); // Save the verified user data into our state
    } catch {
      // If the token is fake or expired, delete it from the browser so it doesn't cause issues
      localStorage.removeItem('cv_token');
      localStorage.removeItem('cv_user');
    } finally {
      // No matter if it succeeded or failed, we are done loading
      setLoading(false);
    }
  }, []);

  // When the app first opens, immediately run `loadUser` to check if they are logged in
  useEffect(() => { loadUser(); }, [loadUser]);

  // Handle the Login process
  const login = async (credentials) => {
    // Send email/password to server
    const { data } = await authService.login(credentials);
    // If valid, the server gives us a new token. Save it in the browser's local storage.
    localStorage.setItem('cv_token', data.token);
    setUser(data.user); // Update React state so the UI changes immediately
    return data;
  };

  // Handle the Registration process
  const register = async (userData) => {
    const { data } = await authService.register(userData);
    localStorage.setItem('cv_token', data.token);
    setUser(data.user);
    return data;
  };

  // Handle Logging Out
  const logout = () => {
    // Delete the security token from the browser completely
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
    setUser(null); // Clear the UI state
  };

  // A tiny helper variable so components can quickly check `if (isAdmin)` instead of `if (user?.role === 'admin')`
  const isAdmin = user?.role === 'admin';

  // Package all these functions and variables up to be shared across the entire app
  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

// A custom hook so components can easily grab the auth variables.
// Example usage: `const { user, logout } = useAuth();`
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  // Prevent awful errors if someone tries to use `useAuth` outside of `AuthProvider`
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
