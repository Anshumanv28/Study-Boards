import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { parseAuthError } from "../utils/authErrors";
import "./Login.css";

const Login: React.FC = () => {
  const { user, signIn, signUp, signInWithGoogle, signInWithFacebook } =
    useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [facebookLoading, setFacebookLoading] = useState(false);

  // Redirect to home if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setEmailLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          const errorMessage = parseAuthError(error);
          setError(errorMessage.message || "An error occurred");
        } else {
          setSuccess(
            "Account created successfully! Please check your email to verify your account."
          );
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          const errorMessage = parseAuthError(error);
          setError(errorMessage.message || "An error occurred");
        } else {
          setSuccess("Signed in successfully! Redirecting...");
          // The useEffect will handle the redirect when user state updates
        }
      }
    } catch (err) {
      const errorMessage = parseAuthError(err as any);
      setError(errorMessage.message || "An error occurred");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        const errorMessage = parseAuthError(error);
        setError(errorMessage.message || "An error occurred");
      }
      // OAuth redirects will be handled by the AuthCallback component
    } catch (err) {
      const errorMessage = parseAuthError(err as any);
      setError(errorMessage.message || "An error occurred");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setError("");
    setFacebookLoading(true);
    try {
      const { error } = await signInWithFacebook();
      if (error) {
        const errorMessage = parseAuthError(error);
        setError(errorMessage.message || "An error occurred");
      }
      // OAuth redirects will be handled by the AuthCallback component
    } catch (err) {
      const errorMessage = parseAuthError(err as any);
      setError(errorMessage.message || "An error occurred");
    } finally {
      setFacebookLoading(false);
    }
  };

  const dismissMessage = (type: "error" | "success") => {
    if (type === "error") setError("");
    if (type === "success") setSuccess("");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p>
            {isSignUp
              ? "Join Study Boards to access all resources"
              : "Sign in to continue your learning journey"}
          </p>
        </div>

        {error && (
          <div className="message error">
            <span className="message-icon">⚠️</span>
            <span className="message-text">{error}</span>
            <button
              className="dismiss-btn"
              onClick={() => dismissMessage("error")}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="message success">
            <span className="message-icon">✅</span>
            <span className="message-text">{success}</span>
            <button
              className="dismiss-btn"
              onClick={() => dismissMessage("success")}
            >
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              className="form-input"
            />
          </div>

          <button
            type="submit"
            className="submit-btn primary"
            disabled={emailLoading}
          >
            {emailLoading
              ? "Processing..."
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>

        <div className="social-buttons">
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="social-btn google"
          >
            <svg className="social-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </button>

          <button
            onClick={handleFacebookSignIn}
            disabled={facebookLoading}
            className="social-btn facebook"
          >
            <svg className="social-icon" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            {facebookLoading ? "Connecting..." : "Continue with Facebook"}
          </button>
        </div>

        <div className="login-footer">
          <p>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
            <button
              className="toggle-btn"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
              }}
            >
              {isSignUp ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
