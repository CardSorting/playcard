import { Button } from "@/components/ui/button";
import { signInWithRedirect, GoogleAuthProvider } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithRedirect(auth, provider);
      // No need for navigation here as the page will redirect and handle return automatically
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="max-w-md w-full p-8 bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Welcome to Pokemon Card Creator
        </h1>
        <Button
          onClick={handleGoogleSignIn}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
