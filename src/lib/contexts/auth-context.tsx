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
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  token: null
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
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
    // Handle redirect result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          await initializeUserData(result.user);
          const token = await result.user.getIdToken();
          setToken(token);
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
        try {
          const token = await user.getIdToken();
          setToken(token);
        } catch (error) {
          console.error('Error getting token:', error);
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, token }}>
      {children}
    </AuthContext.Provider>
  );
}
