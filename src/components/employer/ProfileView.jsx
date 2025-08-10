// src/components/ProfileView.jsx
import React from "react";
import axios from "axios";

export function ProfileView({ profile, setProfile, isEditing, setIsEditing }) {
  const handleLocationSave = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://127.0.0.1:8000/api/employer/location_update",
        {
          location: profile.location,
          status: profile.status ? "true" : "false",
          interestedJobCategory: profile.interestedJobCategory ?? "",
          preferredSkills: profile.preferredSkills ?? "",
          about: profile.about ?? "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      alert("Profile updated!");
    } catch (err) {
      console.error(err);
      alert("Error updating profile.");
    }
  };

  const handleStatusToggle = () => {
    setProfile((prev) => ({ ...prev, status: !prev.status }));
  };

  const buttonStyle = {
    padding: "0.6rem 1.2rem",
    border: "none",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "500",
    cursor: "pointer",
    transition: "background-color 0.2s ease",
    flex: 1,
  };

  return (
    <div style={{ position: "relative" }}>
      {profile.pictureUrl && (
        <img src={profile.pictureUrl} alt="Profile" className="prtmr-avatar" />
      )}
      <p><strong>Name:</strong> {profile.userName ?? "Loading..."}</p>
      <p><strong>Email:</strong> {profile.email ?? "Loading..."}</p>
      <p><strong>Employer ID:</strong> {profile.employerId ?? "Loading..."}</p>

      {/* Location */}
      <p>
        <strong>Location:</strong>{" "}
        {isEditing ? (
          <input
            type="text"
            value={profile.location ?? ""}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, location: e.target.value }))
            }
            style={{ marginLeft: "0.5rem" }}
          />
        ) : (
          profile.location ?? "Not set"
        )}
      </p>

      {/* Interested Job Category */}
      <p>
        <strong>Interested Job Category:</strong>{" "}
        {isEditing ? (
          <input
            type="text"
            value={profile.interestedJobCategory ?? ""}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                interestedJobCategory: e.target.value,
              }))
            }
            style={{ marginLeft: "0.5rem" }}
          />
        ) : (
          profile.interestedJobCategory ?? "Not set"
        )}
      </p>

      {/* Preferred Skills */}
      <p>
        <strong>Preferred Skills:</strong>{" "}
        {isEditing ? (
          <input
            type="text"
            value={profile.preferredSkills ?? ""}
            onChange={(e) =>
              setProfile((prev) => ({
                ...prev,
                preferredSkills: e.target.value,
              }))
            }
            style={{ marginLeft: "0.5rem" }}
          />
        ) : (
          profile.preferredSkills ?? "Not set"
        )}
      </p>

      {/* About */}
      <p>
        <strong>About:</strong>{" "}
        {isEditing ? (
          <textarea
            value={profile.about ?? ""}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, about: e.target.value }))
            }
            rows="3"
            style={{
              marginLeft: "0.5rem",
              width: "100%",
              resize: "vertical",
            }}
          />
        ) : (
          profile.about ?? "Not set"
        )}
      </p>

      {/* Employer status */}
      <p>
        <strong>Me as employer status:</strong>{" "}
        {profile.status === true ? "Visible" : "Hidden"}
      </p>

      {/* Edit button below employer status */}
      {!isEditing && (
        <div style={{ marginBottom: "1rem" }}>
          <button
            style={{
              ...buttonStyle,
              backgroundColor: "#4caf50",
              color: "white",
            }}
            onClick={() => setIsEditing(true)}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#43a047")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#4caf50")}
          >
            Edit Profile
          </button>
        </div>
      )}

      {isEditing && (
        <>
          {/* Toggle button */}
          <div className="status-toggle" style={{ marginBottom: "0.8rem" }}>
            <button
              onClick={handleStatusToggle}
              style={{
                ...buttonStyle,
                backgroundColor: profile.status ? "#f44336" : "#2196f3",
                color: "white",
                flex: "unset",
              }}
              onMouseOver={(e) =>
                (e.target.style.backgroundColor = profile.status
                  ? "#d32f2f"
                  : "#1976d2")
              }
              onMouseOut={(e) =>
                (e.target.style.backgroundColor = profile.status
                  ? "#f44336"
                  : "#2196f3")
              }
            >
              {profile.status ? "Hide Profile" : "Make Visible"}
            </button>
          </div>

          {/* Save / Cancel buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "1rem",
              maxWidth: "320px",
            }}
          >
            <button
              style={{
                ...buttonStyle,
                backgroundColor: "#4caf50",
                color: "white",
              }}
              onClick={async () => {
                await handleLocationSave();
                setIsEditing(false);
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#43a047")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#4caf50")}
            >
              Save
            </button>

            <button
              style={{
                ...buttonStyle,
                backgroundColor: "#9e9e9e",
                color: "white",
              }}
              onClick={() => setIsEditing(false)}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#757575")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#9e9e9e")}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
