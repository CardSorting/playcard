import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/contexts/auth-context';
import { useEffect } from 'react';
import { initializeFirestore } from './lib/initFirestore';
import Home from './components/home';
import BoosterPacks from './components/booster-packs';
import Collection from './components/collection';
import ImageGenerator from './components/image-generator';
import Marketplace from './components/marketplace';
import Claims from './components/claims';
import Login from './components/auth/login';
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
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/booster-packs" element={
              <ProtectedRoute>
                <BoosterPacks />
              </ProtectedRoute>
            } />
            <Route path="/collection" element={
              <ProtectedRoute>
                <Collection />
              </ProtectedRoute>
            } />
            <Route path="/image-generator" element={
              <ProtectedRoute>
                <ImageGenerator />
              </ProtectedRoute>
            } />
            <Route path="/marketplace/*" element={
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            } />
            <Route path="/claims" element={
              <ProtectedRoute>
                <Claims />
              </ProtectedRoute>
            } />
        </Routes>
        <Toaster />
      </FirebaseInitializer>
    </AuthProvider>
  );
}

export default App;
