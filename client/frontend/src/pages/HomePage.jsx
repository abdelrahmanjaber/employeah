/**
 * HomePage - Landing page with main navigation
 * 
 * Displays:
 * - App title: "Employeah"
 * - Introductory sentence
 * - Three main navigation buttons:
 *   1. Search by Skills - Find jobs matching your skills (last 3 months)
 *   2. Search by Jobs - Analyze skill requirements for a job (last 3 months)
 *   3. Historical Data - View skill trends over time (older than 3 months)
 */

import { useNavigate } from "react-router-dom";
import HistoricalStats from "./HistoricalStats";
import { useState } from "react";

function HomePage() {
  const navigate = useNavigate();
  const [showHistoric, setShowHistoric] = useState(false);

  const buttonStyle = {
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "500",
    transition: "transform 0.2s"
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      padding: "3rem 2rem",
      maxWidth: "1200px",
      margin: "0 auto"
    }}>
      {/* Title and intro removed for HistoricalStats, kept for HomePage only */}
      <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem", color: "#1f2937", textAlign: "center" }}>
        Employeah
      </h1>
      <p style={{ fontSize: "1.1rem", color: "#6b7280", marginBottom: "3rem", textAlign: "center" }}>
        Explore job market trends, find positions matching your skills, and discover how skill demand evolves over time.
      </p>

      {/* Navigation buttons */}
      <section style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "3rem" }}>
        {/* Search by Skills button */}
        <button
          style={{ ...buttonStyle, background: "#3b82f6" }}
          onClick={() => navigate("/search/skills")}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          Search by Skills
        </button>

        {/* Search by Jobs button */}
        <button
          style={{ ...buttonStyle, background: "#10b981" }}
          onClick={() => navigate("/search/job")}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          Search by Jobs
        </button>

        {/* Historical Data button */}
        <button
          style={{ ...buttonStyle, background: "#6366f1" }}
          onClick={() => navigate("/historical")}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          Historical Data
        </button>
      </section>

      {/* HistoricalStats is now a separate route, not shown inline here */}
    </main>
  );
}

export default HomePage;

