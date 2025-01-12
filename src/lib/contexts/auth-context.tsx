import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, getRedirectResult } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AUTH_STORAGE_KEY = 'firebaseAuthState';

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// Helper function to persist auth state
const persistAuthState = (user: User | null) => {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

// Helper function to get persisted auth state
const getPersistedAuthState = (): User | null => {
  const user = localStorage.getItem(AUTH_STORAGE_KEY);
  return user ? JSON.parse(user) : null;
};

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    // Check for persisted auth state first
    const persistedUser = getPersistedAuthState();
    if (persistedUser) {
      setUser(persistedUser);
      setLoading(false);
    }

    // Handle redirect result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await initializeUserData(result.user);
          persistAuthState(result.user);
          setUser(result.user);
          navigate('/');
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error handling redirect result:', error);
        setLoading(false);
      });

    // Set up auth state listener
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await initializeUserData(user);
        persistAuthState(user);
      } else {
        persistAuthState(null);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
