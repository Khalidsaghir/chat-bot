import React, { useState } from "react";
import { nhost } from "./nhost";

export default function SignupPage({ onSignupSuccess }) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      // 1. Sign up with Nhost Auth
      const { session, error } = await nhost.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(true);
        return;
      }

      // 2. Optional: Store extra user info in Hasura (like username)
      await fetch("https://mxqijdqmvyumzvrcbwxo.hasura.app/v1/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hasura-admin-secret": "t(8@-$7'rDfM_Zu$,stdbcoX*ucEnfRI",
        },
        body: JSON.stringify({
          query: `
            mutation InsertUser($id: uuid!, $email: String!) {
              insert_users_one(object: {id: $id, email: $email}) {
                id
                email
              }
            }
          `,
          variables: { id: session.user.id, email },
        }),
      });

      onSignupSuccess(); // redirect or show login page
    } catch (err) {
      setError(err.message);
    } finally {
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
        <button className="close-btn"></button>
      </div>
      <div className="login-wrapper">
        <div className="login-box">
          <h1 className="logo">🤖 ChatBot</h1>
          <p className="subtitle">Create a new account to start chatting!</p>
          <form className="login-form" onSubmit={e => { e.preventDefault(); handleSignup(); }}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading} className="login-btn">
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
          <div className="footer-text">
            <p>Already have an account? <button type="button" className="signup-link" onClick={onSignupSuccess}>Login</button></p>
          </div>
        </div>
      </div>
    </>
  );
}
