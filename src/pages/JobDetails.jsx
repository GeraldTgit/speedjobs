import "../styles/JobDetails.css";
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function JobDetails() {
  const [job, setJob] = useState(null);
  const [desiredSalary, setDesiredSalary] = useState("");
  const [bidReason, setBidReason] = useState("");
  const [showBidForm, setShowBidForm] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`http://127.0.0.1:8000/api/joblist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setJob(res.data.job))
      .catch((err) => console.error("Failed to load job details", err));
  }, [id]);

  const applyWithoutBid = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        amount: job.salary      // ✅ match backend field name
      };

      const response = await axios.post(
        `http://127.0.0.1:8000/api/parttimer/apply_job/${id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message || "Application submitted!");
      navigate("/part-timer");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to apply for job");
      console.error(err);
    }
  };

  const applyWithBid = async () => {
    try {
      if (!desiredSalary) {
        alert("Please enter your desired salary.");
        return;
      }

      const token = localStorage.getItem("token");
      const payload = {
        amount: job.salary,              // original salary
        bid_amount: parseFloat(desiredSalary), // bid salary
        bid_reason: bidReason,
      };

      const response = await axios.post(
        `http://127.0.0.1:8000/api/parttimer/apply_job/${id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(response.data.message || "Bid submitted!");
      navigate("/part-timer");
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to submit bid");
      console.error(err);
    }
  };

  if (!job) {
    return <div className="job-details-container">Loading job details...</div>;
  }

  return (
    <div className="job-details-container">
      <div className="job-details-card">
        <h2>{job.category}</h2>

        <div className="job-details-info">
          <p><strong>Short Description:</strong> {job.short_desc}</p>
          <p><strong>Location:</strong> {job.location}</p>
          <p><strong>Duration:</strong> {job.duration_from} to {job.duration_upto}</p>
          <p><strong>Shift:</strong> {job.start_of_shift} - {job.end_of_shift} (Break: {job.break} hrs)</p>
          <p><strong>Salary:</strong> {job.salary} {job.salary_condition}</p>
          <p><strong>Long Description:</strong> {job.long_desc}</p>
          <p><small>job id: {id}</small></p>
        </div>

        {showBidForm && (
          <div className="job-bid-section">
            <label>Desired Salary:</label>
            <input
              type="number"
              placeholder="Enter your bid amount"
              value={desiredSalary}
              onChange={(e) => setDesiredSalary(e.target.value)}
            />

            <label>Reason for Bid:</label>
            <textarea
              placeholder="Explain why you propose this salary"
              value={bidReason}
              onChange={(e) => setBidReason(e.target.value)}
            />

            <button className="apply-btn" onClick={applyWithBid}>
              Submit Bid
            </button>
            <button className="back-btn" onClick={() => navigate("/part-timer")}>
              Cancel
            </button>
          </div>
        )}

        {!showBidForm && (
          <div className="job-details-actions">
            <button className="apply-btn" onClick={applyWithoutBid}>
              Apply
            </button>
            <button
              className="bid-btn"
              onClick={() => setShowBidForm(true)}
            >
              Bid Salary
            </button>
            <button className="back-btn" onClick={() => navigate("/part-timer")}>
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
