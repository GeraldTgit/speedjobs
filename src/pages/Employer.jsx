import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Employer.css";
import axios from "axios";

export default function Employer() {
  const [active, setActive] = useState("dashboard");
  const [employerId, setEmployerId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [pictureUrl, setPictureUrl] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (active === "profile") {
      const token = localStorage.getItem("token");
      axios
        .get("http://127.0.0.1:8000/api/employer/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setUserName(res.data.name);
          setPictureUrl(res.data.picture_url);
          setEmployerId(res.data.as_emp_id);
        })
        .catch(() => {
          setUserName("Not found");
          setPictureUrl(null);
          setEmployerId("Not found");
        });
    }
  }, [active]);

  return (
    <div className="employer-container">
      <div className="employer-card">
        {/* Show "List a job" button at the top when List Job is active */}
        {active === "list" && (
          <button
            className="list-job-btn"
            style={{
              marginBottom: "1.5rem",
              padding: "0.9rem 1.5rem",
              fontSize: "1.1rem",
              borderRadius: "10px",
              border: "none",
              background: "#1976d2",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(30, 136, 229, 0.08)",
              transition: "background 0.2s, transform 0.1s",
            }}
            onClick={() => navigate("/list-job")}
          >
            List a job
          </button>
        )}
        <div className="employer-content">
          {active === "dashboard" && <h2>Employer Dashboard</h2>}
          {active === "search" && <h2>Search for Part-timers</h2>}
          {active === "list" && <h2>List a Job</h2>}
          {active === "profile" && (
            <div>
              {pictureUrl && (
                <img
                  src={pictureUrl}
                  alt="Profile"
                  style={{
                    width: "96px",
                    height: "96px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    marginBottom: "1rem",
                    border: "2px solid #1976d2",
                  }}
                />
              )}
              <p>
                <strong>Name:</strong> {userName ?? "Loading..."}
              </p>
              <p>
                <strong>Employer ID:</strong> {employerId ?? "Loading..."}
              </p>
            </div>
          )}
        </div>
        <nav className="employer-nav">
          <button
            className={active === "dashboard" ? "active" : ""}
            onClick={() => setActive("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={active === "search" ? "active" : ""}
            onClick={() => setActive("search")}
          >
            Search for Part-timers
          </button>
          <button
            className={active === "list" ? "active" : ""}
            onClick={() => navigate("/Home")}
          >
            Home
          </button>
          <button
            className={active === "list" ? "active" : ""}
            onClick={() => setActive("list")}
          >
            List Job
          </button>
          <button
            className={active === "profile" ? "active" : ""}
            onClick={() => setActive("profile")}
          >
            Profile
          </button>
        </nav>
      </div>
    </div>
  );
}