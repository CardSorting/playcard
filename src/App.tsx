import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/contexts/auth-context';
import { useEffect } from 'react';
import { initializeFirestore } from './lib/initFirestore';
import Home from './components/home';
import { Toaster } from './components/ui/toaster';

// Protected route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Initialize Firebase component
const FirebaseInitializer = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeFirestore();
      } catch (error) {
        console.error('Failed to initialize Firestore:', error);
      }
    };

    if (user) {
      initialize();
    }
  }, [user]);

  return <>{children}</>;
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <FirebaseInitializer>
        <Router>
          <Routes>
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            {/* Add more routes as needed */}
          </Routes>
          <Toaster />
        </Router>
      </FirebaseInitializer>
    </AuthProvider>
  );
}

export default App;
