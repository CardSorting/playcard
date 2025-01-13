import { Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/ui/nav';
import { AuthProvider, useAuth } from './lib/contexts/auth-context';
import { useEffect, useState } from 'react';
import { initializeFirestore } from './lib/initFirestore';
import Home from './components/home';
import BoosterPacks from './components/booster-packs';
import Collection from './components/collection';
import ImageGenerator from './components/image-generator';
import Marketplace from './components/marketplace';
import Claims from './components/claims';
import CardCreator from './components/card-creator';
import Login from './components/auth/login';
import Pricing from './components/pricing';
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
  const [firestoreInitialized, setFirestoreInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const initialized = await initializeFirestore();
        setFirestoreInitialized(initialized);
        if (!initialized) {
          console.log('Firestore initialization skipped - no authenticated user');
        }
      } catch (error) {
        console.error('Failed to initialize Firestore:', error);
        setError(error as Error);
      }
    };

    initialize();
  }, [user, loading]);

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  if (error) {
    return <div>Error initializing Firestore: {error.message}</div>;
  }

  if (!firestoreInitialized) {
    return <div>Initializing Firestore...</div>;
  }

  return <>{children}</>;
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 transition-colors duration-300">
        <Nav />
        <Routes>
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
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
      </div>
    </AuthProvider>
  );
}

export default App;
