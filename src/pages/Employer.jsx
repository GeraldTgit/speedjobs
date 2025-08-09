import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Employer.css";
import axios from "axios";

import { JobList } from '../components/employer/JobList';
import { PartTimerList } from "../components/employer/PartTimerList";
import { ProfileView } from "../components/employer/ProfileView";

export default function Employer() {
  const [active, setActive] = useState("dashboard");
  const [profile, setProfile] = useState({
    userName: null,
    email: null,
    pictureUrl: null,
    employerId: null,
    location: null,
    enabled: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [prtmrs, setPrtmrs] = useState([]);
  const initialStatusRef = useRef(null);
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    if (active === "list") {
      axios.get("http://127.0.0.1:8000/api/employer/job", {
        headers: { Authorization: `Bearer ${getToken()}` }
      }).then((res) => setJobs(res.data.jobs))
        .catch((err) => console.error("Failed to load jobs", err));
    }
  }, [active]);

  useEffect(() => {
    if (active === "profile") {
      axios.get("http://127.0.0.1:8000/api/employer/profile", {
        headers: { Authorization: `Bearer ${getToken()}` },
      })
        .then((res) => {
          const { name, picture_url, email, as_emp_id, location, status } = res.data;
          setProfile({ userName: name, pictureUrl: picture_url, email, employerId: as_emp_id, location, enabled: status });
          initialStatusRef.current = status;
        })
        .catch(() => {
          setProfile({
            userName: "Not found",
            pictureUrl: null,
            email: "Not found",
            employerId: "Not found",
            location: "Not found",
            enabled: false,
          });
          initialStatusRef.current = false;
        });
    }
  }, [active]);

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/employer/available-parttimers", {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((res) => setPrtmrs(res.data.as_parttimer || []))
      .catch((err) => console.error("Failed to fetch part-timers", err));
  }, []);

  useEffect(() => {
    if (initialStatusRef.current !== null && initialStatusRef.current !== true) {
      axios.post("http://127.0.0.1:8000/api/employer/status_update", { status: true }, { withCredentials: true })
        .then(() => (initialStatusRef.current = false))
        .catch((err) => console.error("Failed to update status", err));
    }
  }, []);

  return (
    <div className="employer-container">
      <div className="employer-card">
        {active === "list" && (
          <JobList
            jobs={jobs}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        )}

        <div className="employer-content">
          {active === "dashboard" && <h2>Employer Dashboard</h2>}
          {active === "search" && (
            <PartTimerList
              prtmrs={prtmrs}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          )}
          {active === "profile" && (
            <ProfileView
              profile={profile}
              setProfile={setProfile}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
            />
          )}
        </div>

        <nav className="employer-nav">
          {["dashboard", "search", "list", "profile"].map((tab) => (
            <button
              key={tab}
              className={active === tab ? "active" : ""}
              onClick={() => setActive(tab)}
            >
              {tab === "search" ? "Search for Part-timers" : tab === "list" ? "List Job" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
          <button onClick={() => navigate("/Home")}>Home</button>
        </nav>
      </div>
    </div>
  );
}
