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
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (active === "list") {
      const token = localStorage.getItem("token");
      axios
        .get("http://127.0.0.1:8000/api/employer/jobs", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => setJobs(res.data.jobs))
        .catch((err) => console.error("Failed to load jobs", err));
    }
  }, [active]);

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
        <div>
          <button
            className="list-job-btn"
            style={{
              marginBottom: "1rem",
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
            List a new job
          </button>
          
          <input
            type="text"
            placeholder="Search jobs..."
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: "0.6rem", marginBottom: "1rem", width: "100%", borderRadius: "5px", border: "1px solid #ccc" }}
          />
      
          <div className="job-cards">
            {jobs
              .filter(job => job.category.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((job) => (
                <div className="job-card" key={job.id} >
                  <div className="job-card-row" onClick={() => navigate(`/list-job/${job.id}`)} style={{ cursor: "pointer" }}>
                    <p><strong>{job.category}</strong></p>
                    <p className="right">{new Date(job.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="job-card-row">
                    <p>{job.short_desc}</p>
                    <p className="right"><strong>{job.status}</strong></p>
                  </div>
                  <p className="smaller">job id: {job.id}</p>
                </div>
              ))}
          </div>
        </div>
      )}
        <div className="employer-content">
          {active === "dashboard" && <h2>Employer Dashboard</h2>}
          {active === "search" &&  
          (<div>
            <input
              type="text"
              placeholder="Search for Part-timers..."
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "0.6rem", marginBottom: "1rem", width: "100%", borderRadius: "5px", border: "1px solid #ccc" }}
            />

            {/* TOBE CONTINUE :: Assuming prtmrs is fetched from an API or state */}
            <div className="prtmr-cards">
              {prtmrs
                .filter(prtmrs => prtmrs.category.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((prtmrs) => (
                  <div className="prtmr-card" key={prtmr.id} >
                    <div className="prtmr-card-row" onClick={() => navigate(`/prtmr-profile/${prtmr.id}`)} style={{ cursor: "pointer" }}>
                      <p><strong>{prtmr.name}</strong></p>
                      <p className="right">{prtmr.location}</p>
                    </div>
                    <div className="prtmr-card-row">
                      <p>{prtmr.specialty}</p>
                      <p className="right"><strong>{prtmr.stars}</strong></p>
                    </div>
                    <p className="smaller">part-timer id: {prtmr.id}</p>
                  </div>
                ))}
            </div>
          </div>
          )
          }
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