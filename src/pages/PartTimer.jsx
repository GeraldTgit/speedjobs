import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/PartTimer.css";
import axios from "axios";

export default function Employer() {
  const [active, setActive] = useState("dashboard");
  const [ParttimerId, setParttimerId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [pictureUrl, setPictureUrl] = useState(null);
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (active === "list") {
      const token = localStorage.getItem("token");
      axios
        .get("http://127.0.0.1:8000/api/parttimer/jobs", {
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
        .get("http://127.0.0.1:8000/api/parttimer/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          setUserName(res.data.name);
          setPictureUrl(res.data.picture_url);
          setParttimerId(res.data.as_prtmr_id);
        })
        .catch(() => {
          setUserName("Not found");
          setPictureUrl(null);
          setParttimerId("Not found");
        });
    }
  }, [active]);

  return (
    <div className="employer-container">
      <div className="employer-card">
        {/* Show "List a job" button at the top when List Job is active */}
        {active === "search" && (
        <div>

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
          {active === "search" && <h2>Search for Part-time job</h2>}
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
                <strong>Part-Timer ID:</strong> {ParttimerId ?? "Loading..."}
              </p>
            </div>
          )}
        </div>
        <nav className="parttimer-nav">
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
            Search for Jobs
          </button>
          <button
            className={active === "list" ? "active" : ""}
            onClick={() => navigate("/Home")}
          >
            Home
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