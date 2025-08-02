import React, { useEffect, useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import Logo from "../images/speedjobs_logo.png"; // Adjust the path as necessary
import "../styles/Signup.css"; // Assuming you have a CSS file for styles
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // or "signup"
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    console.log("Environment check:", {
      hasGoogleClientId: !!import.meta.env.VITE_GOOGLE_CLIENT_ID,
      clientIdLength: import.meta.env.VITE_GOOGLE_CLIENT_ID?.length,
      frontendUrl: window.location.origin,
    });
  }, []);

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        throw new Error("No credential received from Google");
      }

      const res = await axios.post(
        "http://127.0.0.1:8000/api/auth/google",
        { token: credentialResponse.credential },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      localStorage.setItem("user", JSON.stringify(res.data.user));
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
      }

      navigate("/Home"); // Use React Router navigation
    } catch (error) {
      console.error("Authentication failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleGoogleLoginError = (error) => {
    console.error("Google login failed:", error);
    alert("Google login failed. Please try again.");
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthMessage("");
    setAuthError("");
    // Email/password logic removed since inputs are not present
    setAuthError("Email login is not available yet.");
  };

  return (
    <div className="page-container">
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <div className="signup-card-container">
        
          <div className="signup-wrapper">
            <h1>Welcome to</h1>
            <div className="logo-container">
            <img src={Logo} alt="Company Logo" className="company-logo" />
          </div>

            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={handleGoogleLoginError}
              useOneTap
              auto_select
              context="signup"
              flow="implicit"
              ux_mode="popup"
            />

            <p className="separator-text">Login via Email soon..</p>

            {/* Removed email and password input boxes */}
            <form onSubmit={handleEmailAuth} className="email-auth-form">
        
              {authError && <p className="error">{authError}</p>}
              {authMessage && <p className="success">{authMessage}</p>}
            </form>

            <button
              className="toggle-mode"
              onClick={() =>
                setMode((prev) => (prev === "signup" ? "login" : "signup"))
              }
            >
              {mode === "signup"
                ? "Already have an account? Log In"
                : "New user? Sign Up"}
            </button>
          </div>
        </div>
      </GoogleOAuthProvider>
    </div>
  );
}
