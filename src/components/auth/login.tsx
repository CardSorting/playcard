import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/contexts/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function Login() {
  const { user, loading, initialized } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const provider = new GoogleAuthProvider();

  // Only redirect if auth is initialized and user exists
  if (initialized && user) {
    return <Navigate to="/" />;
  }

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    
    try {
      await signInWithPopup(auth, provider);
      // Successful login will trigger auth state change and redirect
    } catch (error: any) {
      console.error("Error signing in with Google:", error);
      setError(error.message || "Failed to sign in. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  // Show loading state while auth is initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
        <div className="max-w-md w-full p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-md w-full p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Welcome to Pokemon Card Creator
        </h1>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button
          onClick={handleGoogleSignIn}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
          disabled={isSigningIn}
        >
          {isSigningIn ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {isSigningIn ? "Signing in..." : "Sign in with Google"}
        </Button>
      </div>
    </div>
  );
}
