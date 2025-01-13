import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  token: null,
  initialized: false
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const navigate = useNavigate();

  // Helper function to initialize user data
  const initializeUserData = async (user: User) => {
    try {
      // Create or verify user document
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Create default collection if it doesn't exist
      const defaultCollectionId = `default-${user.uid}`;
      const collectionRef = doc(db, 'collections', defaultCollectionId);
      const collectionDoc = await getDoc(collectionRef);

      if (!collectionDoc.exists()) {
        await setDoc(collectionRef, {
          userId: user.uid,
          name: 'My Collection',
          description: 'Your default card collection',
          isPublic: false,
          totalCards: 0,
          uniqueTypes: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error initializing user data:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;

    console.log('Setting up auth state listener...');
    console.log('Current auth state:', auth.currentUser);

    const handleAuthState = async (user: User | null) => {
      if (!isMounted) return;

      console.log('Auth state changed:', user);
      
      if (user) {
        console.log('User authenticated:', user.uid);
        await initializeUserData(user);
        try {
          const token = await user.getIdToken();
          console.log('Token received:', token);
          setToken(token);
          sessionStorage.setItem('firebaseToken', token);
        } catch (error) {
          console.error('Error getting token:', error);
          setToken(null);
          sessionStorage.removeItem('firebaseToken');
        }
      } else {
        console.log('No authenticated user');
        setToken(null);
        sessionStorage.removeItem('firebaseToken');
      }
      
      setUser(user);
      if (!initialized) {
        setInitialized(true);
        setLoading(false);
      }
    };

    // Handle redirect result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          console.log('Redirect result received:', result.user.uid);
          await handleAuthState(result.user);
          navigate('/');
        }
      })
      .catch((error) => {
        console.error('Error handling redirect result:', error);
      });

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid);
      await handleAuthState(user);
    });

    return () => {
      console.log('Cleaning up auth state listener');
      isMounted = false;
      unsubscribe();
    };
  }, [navigate, initialized]);

  return (
    <AuthContext.Provider value={{ user, loading, token, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}
