// src/components/JobList.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export function JobList({ jobs, searchQuery, setSearchQuery, setIsEditing, isEditing }) {
  const navigate = useNavigate();

  return (
    <div>
      <button
        className="list-job-btn"
        style={{ marginBottom: "1rem" }}
        onClick={() => navigate("/list-job")}
      >
        List a new job
      </button>

      <input
        type="text"
        placeholder="Search jobs..."
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ padding: "0.6rem", marginBottom: "1rem", width: "100%" }}
      />

      <div className="job-cards">
        {jobs
          .filter((job) => job.category.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((job) => (
            <div className="job-card" key={job.id}>
              <div
                className="job-card-row"
                onClick={() => navigate(`/list-job/${job.id}`)}
                style={{ cursor: "pointer" }}
              >
                <p><strong>{job.category}</strong></p>
                <p className="right">{new Date(job.created_at).toLocaleDateString()}</p>
              </div>
              <div className="job-card-row">
                <p>{job.short_desc}</p>
                <p className="right"><strong>{job.status}</strong></p>
              </div>
              <p className="smaller">job id: {job.id}</p>
              <button className="edit-btn" onClick={() => setIsEditing((prev) => !prev)}>
                {isEditing ? "Save" : "Edit"}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
