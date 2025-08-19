import React, { useEffect, useState } from "react";
import { nhost } from "./nhost";
import LoginPage from "./LoginPage";
import SignupPage from "./signuppage";
import ChatPage from "./ChatPage";
import "./chat.css";
import "./login.css";
import "./app.css";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false); // false: show login first

  useEffect(() => {
    // Subscribe to Nhost auth changes
    const unsubscribe = nhost.auth.onAuthStateChanged((event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    // Check initial user
    const currentUser = nhost.auth.getUser();
    setUser(currentUser);
    setLoading(false);

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  if (user) return <ChatPage user={user} />;

  if (showSignup) {
    return <SignupPage onSignupSuccess={() => setShowSignup(false)} />;
  }

  return <LoginPage onShowSignup={() => setShowSignup(true)} />;
}

export default App;
