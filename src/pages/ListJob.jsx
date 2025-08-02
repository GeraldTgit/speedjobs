import React, { useState } from "react";
import "../styles/ListJob.css";
import { useNavigate } from "react-router-dom";

export default function ListJob() {
  const [form, setForm] = useState({
    category: "",
    location: "",
    date: "",
    start_of_shift: "",
    end_of_shift: "",
    break: "",
    salary: "",
    salary_condition: "",
    short_desc: "",
    long_desc: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8000/api/joblist", {
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
        <h2>List a Job</h2>
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
          required
        />
        <input
          type="date"
          name="date"
          placeholder="Date"
          value={form.date || ""}
          onChange={handleChange}
          required
        />
        <input
          type="time"
          name="start_of_shift"
          placeholder="Start of shift"
          value={form.start_of_shift || ""}
          onChange={handleChange}
          required
        />
        <input
          type="time"
          name="end_of_shift"
          placeholder="End of shift"
          value={form.end_of_shift || ""}
          onChange={handleChange}
          required
        />
        <input
          type="float"
          name="break"
          placeholder="Break (1 = 1 hour; 0.5 = 30 minutes)"
          value={form.break || ""}
          onChange={handleChange}
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
          
            // Subtract break (in milliseconds)
            const breakHours = parseFloat(form.break) || 0;
            const breakMs = breakHours * 60 * 60 * 1000;
            diffMs = Math.max(0, diffMs - breakMs); // prevent negative duration
          
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
          value={form.salary}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="salary_condition"
          placeholder="Salary Condition"
          value={form.salaryCondition}
          onChange={handleChange}
        />
        <input
          type="text"
          name="short_desc"
          placeholder="Short Description"
          value={form.shoft_desc}
          onChange={handleChange}
          required
        />
        <textarea
          name="long_desc"
          placeholder="Long Description"
          value={form.long_desc}
          onChange={handleChange}
          rows={4}
          required
        />
        <div className="list-job-actions">
          <button type="submit" className="save-btn" >Save</button>
          <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
        </div>
      </form>
    </div>
  );
}