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

  const [categories, setCategories] = useState([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomShortDesc, setIsCustomShortDesc] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const { id } = useParams();
  const location = useLocation();
  const isPartTimer = location.pathname.startsWith("/part-timer");

  const current = categories.find(
    (c) => String(c.id) === String(selectedCategoryId)
  );
  const shortDescOptions = current ? current.short_descs : [];

  // Fetch categories + short descriptions
  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/joblist/get_categories_with_short_descs")
      .then((res) => {
        setCategories(res.data);
      })
      .catch((err) =>
        console.error("Failed to load categories + short descs", err)
      );
  }, []);

  // Fetch job for editing
  useEffect(() => {
    if (id != null && typeof id === "string" && id.trim().length > 0) {
      const token = localStorage.getItem("token");
      axios
        .get(`http://127.0.0.1:8000/api/joblist/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setForm(res.data.job);
        })
        .catch(() => console.error("Failed to load job for editing"));
    }
  }, [id]);

  useEffect(() => {
    // auto-fill only when short_desc is a selected option (not the "Other" typed case)
    if (!isCustomShortDesc && form.short_desc && form.short_desc.trim() !== "") {
      fetchLongDesc(form.short_desc);
    } else if (isCustomShortDesc) {
      // user typed their own short_desc — clear or keep existing long_desc editable
      setForm(prev => ({ ...prev, long_desc: "" }));
    }
  }, [form.short_desc, isCustomShortDesc]);


  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === "__other__") {
      setIsCustomCategory(true);
      setSelectedCategoryId("");
      setForm((prev) => ({ ...prev, category: "" }));
    } else {
      setIsCustomCategory(false);
      setSelectedCategoryId(value);
      const cat = categories.find((c) => String(c.id) === String(value));
      setForm((prev) => ({
        ...prev,
        category: cat ? cat.category : "",
      }));
    }
  };

  // helper to fetch long_desc
  const fetchLongDesc = async (shortDesc) => {
    if (!shortDesc) {
      setForm(prev => ({ ...prev, long_desc: "" }));
      return;
    }

    try {
      const res = await axios.get("http://127.0.0.1:8000/api/joblist/get_long_desc", {
        params: { short_desc: shortDesc }
      });
      setForm(prev => ({ ...prev, long_desc: res.data.long_desc || "" }));
    } catch (err) {
      console.error("Failed to fetch long description", err);
      // keep long_desc as-is or clear it:
      // setForm(prev => ({ ...prev, long_desc: "" }));
    }
  };


  const handleSave = async (e) => {
    e.preventDefault();

    if (isPartTimer) {
      alert("Part-timers are not allowed to edit jobs.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:8000/api/joblist/listNewJob",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...form,
            break_: parseFloat(form.break || 0),
            salary: parseFloat(form.salary),
          }),
        }
      );

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

        {/* Category dropdown with custom option */}
        {!isPartTimer && (
          <>
            <select
              value={isCustomCategory ? "__other__" : selectedCategoryId}
              onChange={handleCategoryChange}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category}
                </option>
              ))}
              <option value="__other__">Other (type your own)</option>
            </select>

            {isCustomCategory && (
              <input
                type="text"
                name="category"
                placeholder="Enter custom category"
                value={form.category}
                onChange={handleChange}
                required
              />
            )}
          </>
        )}
        {isPartTimer && (
          <input
            type="text"
            name="category"
            placeholder="Category"
            value={form.category || ""}
            onChange={handleChange}
            disabled
          />
        )}

        {/* Short description dropdown with custom option */}
        <select
          name="short_desc"
          value={isCustomShortDesc ? "__other__" : form.short_desc}
          onChange={(e) => {
            if (e.target.value === "__other__") {
              setIsCustomShortDesc(true);
              setForm((prev) => ({ ...prev, short_desc: "" }));
            } else {
              setIsCustomShortDesc(false);
              setForm((prev) => ({ ...prev, short_desc: e.target.value }));
            }
          }}
        >
          <option value="">Select short description</option>
          {shortDescOptions.map((sd, i) => (
            <option key={i} value={sd}>
              {sd}
            </option>
          ))}
          <option value="__other__">Other (type your own)</option>
        </select>

        {isCustomShortDesc && (
          <input
            type="text"
            name="short_desc"
            placeholder="Enter custom short description"
            value={form.short_desc}
            onChange={handleChange}
            required
          />
        )}

        {/* Location */}
        <input
          type="text"
          name="location"
          placeholder="Location"
          value={form.location || ""}
          onChange={handleChange}
          required
          disabled={isPartTimer}
        />

        {/* Dates */}
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

        {/* Shift times */}
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

        {/* Salary */}
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

        {/* Long description */}
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
          {!isPartTimer && (
            <button type="submit" className="save-btn">
              Save
            </button>
          )}
          <button
            type="button"
            className="cancel-btn"
            onClick={handleCancel}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
