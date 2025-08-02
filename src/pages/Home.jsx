import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/"); // Redirect to login/signup
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h2 className="home-title">Welcome!</h2>
        <h2 className="sub-title">Continue as:</h2>
        <div className="home-buttons">
          <button onClick={() => navigate("/part-timer")}>Part-timer</button>
          <button onClick={() => navigate("/employer")}>Employer</button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}