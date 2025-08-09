// src/components/PartTimerList.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export function PartTimerList({ prtmrs, searchQuery, setSearchQuery }) {
  const navigate = useNavigate();

  return (
    <div>
      <input
        type="text"
        placeholder="Search for Part-timers..."
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ padding: "0.6rem", marginBottom: "1rem", width: "100%" }}
      />

      <div className="prtmr-cards">
        {prtmrs
          .filter((prtmr) => prtmr.name?.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((prtmr) => (
            <div className="prtmr-card" key={prtmr.as_pmrtr_id}>
              <div
                className="prtmr-card-row"
                onClick={() => navigate(`/prtmr-profile/${prtmr.as_pmrtr_id}`)}
                style={{ cursor: "pointer" }}
              >
                {prtmr.picture_url && (
                  <img
                    src={prtmr.picture_url}
                    alt="Profile"
                    className="prtmr-avatar"
                  />
                )}
                <p><strong>{prtmr.name}</strong></p>
                <p className="right">{prtmr.location}</p>
              </div>
              <p className="smaller">part-timer id: {prtmr.id}</p>
            </div>
          ))}
      </div>
    </div>
  );
}
