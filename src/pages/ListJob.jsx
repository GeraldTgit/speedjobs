import "../styles/ListJob.css";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import axios from "axios";

export default function ListJob() {
  const [form, setForm] = useState({
    category: "",
    location: "",
    duration_from: "",
    duration_upto: "",
    start_of_shift: "",
    end_of_shift: "",
    break: "",
    salary: "",
    salary_condition: "",
    short_desc: "",
    long_desc: "",
  });

  const { id } = useParams(); // Get job ID from URL
  const location = useLocation();
  const isPartTimer = location.pathname.startsWith("/part-timer");

  useEffect(() => {
    if (id) {
      const token = localStorage.getItem("token");
      axios
        .get(`http://127.0.0.1:8000/api/joblist/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then((res) => {
          setForm(res.data.job);
        })
        .catch(() => console.error("Failed to load job for editing"));
    }
  }, [id]);

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Restrict save for part-timer URLs
    if (isPartTimer) {
      alert("Part-timers are not allowed to edit jobs.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/joblist/listNewJob", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          break_: parseFloat(form.break || 0),
          salary: parseFloat(form.salary),
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Failed to save job");
      alert("Job saved!");
      navigate("/employer");
    } catch (err) {
      alert(err.message);
      console.error(err);
    }
  };

  const handleCancel = () => {
    navigate("/employer");
  };

  return (
    <div className="list-job-container">
      <form className="list-job-form" onSubmit={handleSave}>
        <h2>{id ? "Edit Job" : "List a Job"}</h2>
        {id && <p className="job-id">Job ID: {id}</p>}

        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />
        <input
          type="text"
          name="short_desc"
          placeholder="Short Description"
          value={form.short_desc || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={form.location || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />
        <p className="duration-text">Start Date:</p>
        <input
          type="date"
          name="duration_from"
          value={form.duration_from || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />
        <p className="duration-text">End Date:</p>
        <input
          type="date"
          name="duration_upto"
          value={form.duration_upto || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />

        {/* Duration difference and warning */}
        {form.duration_from && form.duration_upto && (() => {
          const from = new Date(form.duration_from);
          const to = new Date(form.duration_upto);
          if (from > to) {
            return (
              <div style={{ color: "#e53935", marginBottom: "0.5rem", fontWeight: "600" }}>
                Warning: "From" date/time is later than "To" date/time!
              </div>
            );
          } else if (from.getTime() === to.getTime()) {
            return (
              <div style={{ color: "#1976d2", marginBottom: "0.5rem", fontWeight: "500" }}>
                Duration: Less than a day only
              </div>
            );
          } else {
            const diffMs = to - from;
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            return (
              <div style={{ color: "#1976d2", marginBottom: "0.5rem", fontWeight: "500" }}>
                Duration: {diffDays} day(s)
              </div>
            );
          }
        })()}

        <p className="duration-text">Shift starts at:</p>
        <input
          type="time"
          name="start_of_shift"
          value={form.start_of_shift || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />
        <p className="duration-text">Shift ends at:</p>
        <input
          type="time"
          name="end_of_shift"
          value={form.end_of_shift || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />
        <input
          type="float"
          name="break"
          placeholder="Break (1 = 1 hour; 0.5 = 30 minutes)"
          value={form.break || ""}
          onChange={handleChange}
          disabled={isPartTimer}
        />

        {/* Duration difference and warning */}
        {form.start_of_shift && form.end_of_shift && (() => {
          const [startHours, startMinutes] = form.start_of_shift.split(":").map(Number);
          const [endHours, endMinutes] = form.end_of_shift.split(":").map(Number);
          const start = new Date(0, 0, 0, startHours, startMinutes, 0);
          const end = new Date(0, 0, 0, endHours, endMinutes, 0);

          if (start > end) {
            return (
              <div style={{ color: "#e53935", marginBottom: "0.5rem", fontWeight: "600" }}>
                Warning: Start of shift is later than End of shift!
              </div>
            );
          } else {
            let diffMs = end - start;
            const breakHours = parseFloat(form.break) || 0;
            const breakMs = breakHours * 60 * 60 * 1000;
            diffMs = Math.max(0, diffMs - breakMs);
            const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

            return (
              <div style={{ color: "#1976d2", marginBottom: "0.5rem", fontWeight: "500" }}>
                Duration (less break): {diffHours} hour(s) {diffMinutes} minute(s)
              </div>
            );
          }
        })()}

        <input
          type="number"
          name="salary"
          placeholder="Salary"
          value={form.salary || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />
        <input
          type="text"
          name="salary_condition"
          placeholder="Salary Condition"
          value={form.salary_condition || ""}
          onChange={handleChange}
          disabled={isPartTimer}
        />
        <textarea
          name="long_desc"
          placeholder="Long Description"
          value={form.long_desc || ""}
          onChange={handleChange}
          rows={4}
          required
          disabled={isPartTimer}
        />

        <div className="list-job-actions">
          {!isPartTimer && <button type="submit" className="save-btn">Save</button>}
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
