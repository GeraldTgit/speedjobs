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
        status: profile.status ? "true" : "false", // convert boolean to string
      },
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
};

  const handleStatusToggle = () => {
    setProfile((prev) => ({ ...prev, status: !prev.status }));
  };

  return (
    <div style={{ position: "relative" }}>
      {profile.pictureUrl && (
        <img src={profile.pictureUrl} alt="Profile" className="prtmr-avatar" />
      )}
      <p><strong>Name:</strong> {profile.userName ?? "Loading..."}</p>
      <p><strong>Email:</strong> {profile.email ?? "Loading..."}</p>
      <p><strong>Employer ID:</strong> {profile.employerId ?? "Loading..."}</p>

      <p>
        <strong>Location:</strong>{" "}
        {isEditing ? (
          <input
            type="text"
            value={profile.location}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, location: e.target.value }))
            }
            style={{ marginLeft: "0.5rem" }}
          />
        ) : (
          profile.location ?? "Not set"
        )}
      </p>

      <p>
        <strong>Me as employer status:</strong>{" "}
        {profile.status === true ? "Visible" : "Hidden"}
      </p>

      {isEditing && (
        <>
          <div className="status-toggle" style={{ marginBottom: "0.8rem" }}>
            <button
              onClick={handleStatusToggle}
              style={{
                padding: "0.6rem 1.2rem",
                backgroundColor: profile.status ? "#f44336" : "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
              }}
            >
              {profile.status ? "Hide Profile" : "Make Visible"}
            </button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", maxWidth: "300px" }}>
            <button
              className="edit-btn"
              onClick={async () => {
                await handleLocationSave();
                setIsEditing(false);
              }}
            >
              Save
            </button>
            <button
              className="cancel-btn"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {!isEditing && (
        <button
          className="edit-btn"
          style={{ marginTop: "1rem" }}
          onClick={() => setIsEditing(true)}
        >
          Edit
        </button>
      )}
    </div>
  );

}
