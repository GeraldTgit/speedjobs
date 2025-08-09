// src/components/parttimer/JobList.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export function JobList({ jobs, searchQuery, setSearchQuery }) {
  const navigate = useNavigate();

  return (
    console.log("Rendering JobList with jobs:", jobs),
    <div>
      <input
        type="text"
        placeholder="Search jobs..."
        onChange={(e) => setSearchQuery(e.target.value)}
        value={searchQuery}
        style={{ padding: "0.6rem", marginBottom: "1rem", width: "100%" }}
      />

      <div className="job-cards">
        {jobs
          .filter((job) =>
            job.category.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((job) => (
            <div className="job-card" key={job.id}>
              <div
                className="job-card-row"
                onClick={() => navigate(`/part-timer/job/${job.id}`)}
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
            </div>
          ))}
      </div>
    </div>
  );
}
