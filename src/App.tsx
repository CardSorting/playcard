import { Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/ui/nav';
import { AuthProvider, useAuth } from './lib/contexts/auth-context';
import { useEffect } from 'react';
import { initializeFirestore } from './lib/initFirestore';
import Home from './components/home';
import BoosterPacks from './components/booster-packs';
import Collection from './components/collection';
import ImageGenerator from './components/image-generator';
import Marketplace from './components/marketplace';
import Claims from './components/claims';
import CardCreator from './components/card-creator';
import Login from './components/auth/login';
import { Toaster } from './components/ui/toaster';

// Route wrappers
// Redirects authenticated users away from login page
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Protects routes from unauthenticated users
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Initialize Firebase component
const FirebaseInitializer = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeFirestore();
      } catch (error) {
        console.error('Failed to initialize Firestore:', error);
      }
    };

    if (!loading && user) {
      initialize();
    }
  }, [user, loading]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <Nav />
      <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/" element={<Home />} />
          <Route path="/booster-packs" element={
            <FirebaseInitializer>
              <ProtectedRoute>
                <BoosterPacks />
              </ProtectedRoute>
            </FirebaseInitializer>
          } />
          <Route path="/collection" element={
            <FirebaseInitializer>
              <ProtectedRoute>
                <Collection />
              </ProtectedRoute>
            </FirebaseInitializer>
          } />
          <Route path="/image-generator" element={
            <FirebaseInitializer>
              <ProtectedRoute>
                <ImageGenerator />
              </ProtectedRoute>
            </FirebaseInitializer>
          } />
          <Route path="/marketplace/*" element={
            <FirebaseInitializer>
              <ProtectedRoute>
                <Marketplace />
              </ProtectedRoute>
            </FirebaseInitializer>
          } />
          <Route path="/claims" element={
            <FirebaseInitializer>
              <ProtectedRoute>
                <Claims />
              </ProtectedRoute>
            </FirebaseInitializer>
          } />
          <Route path="/card-creator" element={
            <FirebaseInitializer>
              <ProtectedRoute>
                <CardCreator />
              </ProtectedRoute>
            </FirebaseInitializer>
          } />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
