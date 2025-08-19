import React, { useState } from "react";
import { nhost } from "./nhost";

export default function LoginPage({ onShowSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { session, error } = await nhost.auth.signIn({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      // On success, App.jsx will detect and re-render ChatPage
    } catch (err) {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="chatbot-header">
        <div className="chatbot-header-left">
          <img src="chat_botimg.jpg" alt="Bot Logo" className="chatbot-logo" />
          <span className="chatbot-title">My Chatbot</span>
        </div>
        <button className="close-btn" aria-label="Close login form"></button>
      </div>
      <div className="login-wrapper">
        <div className="login-box">
          <h1 className="logo">🤖 ChatBot</h1>
          <p className="subtitle">Welcome back! Please sign in to continue</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="error">{error}</p>}

            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="footer-text">
            <p>
              Don’t have an account?{" "}
              <button type="button" className="signup-link" onClick={onShowSignup}>
                Sign up
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};