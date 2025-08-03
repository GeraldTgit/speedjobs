import React from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/"); // Redirect to login/signup
  };

  const handleEmployer = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post('http://localhost:8000/api/save_as_employer', {}, {
        headers: { Authorization: `Bearer ${token}` 
        }
      });
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
    navigate("/employer");
  };

    const handlePartTimer = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post('http://localhost:8000/api/save_as_prtmr', {}, {
        headers: { Authorization: `Bearer ${token}` 
        }
      });
      console.log(res.data);
    } catch (err) {
      console.error(err);
    }
    navigate("/part-timer");
  };


  return (
    <div className="home-container">
      <div className="home-card">
        <h2 className="home-title">Welcome!</h2>
        <h2 className="sub-title">Continue as:</h2>
        <div className="home-buttons">
          <button onClick={handlePartTimer}>Part-timer</button>
          <button onClick={handleEmployer}>Employer</button>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
}