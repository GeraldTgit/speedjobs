import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Parttimer.css";
import axios from "axios";

import { JobList } from '../components/parttimer/JobList';

export default function Parttimer() {
  const [active, setActive] = useState("dashboard");
  const [parttimerId, setParttimerId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [email, setEmail] = useState(null);
  const [pictureUrl, setPictureUrl] = useState(null);
  const [location, setLocation] = useState(null); // Initial location value
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [prtmrs, setPrtmrs] = useState([]);
  const [jobs, setJobs] = useState([]);
  

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
          setEmail(res.data.email);
          setParttimerId(res.data.as_prtmr_id);
          setLocation(res.data.location);
        })
        .catch(() => {
          setUserName("Not found");
          setEmail("Not found");
          setPictureUrl(null);
          setParttimerId("Not found");
          setLocation("Not found");
        });
    }
  }, [active]);

  const getToken = () => localStorage.getItem("token");

  useEffect(() => {
    if (active === "search") {
      axios.get("http://127.0.0.1:8000/api/parttimer/job", {
        headers: { Authorization: `Bearer ${getToken()}` }
      }).then((res) => setJobs(res.data.jobs))
        .catch((err) => console.error("Failed to load jobs", err));
    }
  }, [active]);


  return (
    <div className="parttimer-container">
      <div className="parttimer-card">
        {/* Show "List a job" button at the top when List Job is active */}
        {active === "list" && (
        <div>
          
      
        </div>
      )}
        <div className="parttimer-content">
          {active === "dashboard" && <h2>Parttimer Dashboard</h2>}
          {active === "search" &&  
          (<div><JobList
              jobs={jobs}
             searchQuery={searchQuery}
             setSearchQuery={setSearchQuery}
            />
          </div>
          )
          }
          {active === "profile" && (
            <div style={{ position: "relative" }}>
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
              <p><strong>Name:</strong> {userName ?? "Loading..."}</p>
              <p><strong>Email:</strong> {email ?? "Loading..."}</p>
              <p><strong>Part-Timer ID:</strong> {parttimerId ?? "Loading..."}</p>
            
              <p>
                <strong>Location:</strong>{" "}
                {isEditing ? (
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    style={{ marginLeft: "0.5rem" }}
                  />
                ) : (
                  location ?? "Not set"
                )}
              </p>
              
              <button
                onClick={async () => {
                  if (isEditing) {
                    // Save location via API
                    try {
                      const token = localStorage.getItem("token");      
                      await axios.post(
                        'http://127.0.0.1:8000/api/parttimer/location_update',
                        { location }, // sent as JSON
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                          },
                        }
                      );
                    
                      alert("Location updated!");
                    } catch (err) {
                      console.error(err);
                      alert("Error updating location.");
                    }
                  }
                
                  // Toggle editing state
                  setIsEditing((prev) => !prev);
                }}
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  padding: "6px 12px",
                  backgroundColor: "#1976d2",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                {isEditing ? "Save" : "Edit"}
              </button>

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