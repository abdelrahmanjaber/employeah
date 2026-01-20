/**
 * HomePage - Landing page with main navigation
 * * Displays:
 * - App title: "Employeah"
 * - Introductory sentence
 * - Three main navigation buttons:
 * 1. Search by Skills - Find jobs matching your skills (last 3 months)
 * 2. Search by Jobs - Analyze skill requirements for a job (last 3 months)
 * 3. Historical Data - View skill trends over time (older than 3 months)
 */

import { useNavigate } from "react-router-dom";
import { useState } from "react";

function HomePage() {
  const navigate = useNavigate();

  const buttonStyle = {
    padding: "1rem 2rem",
    fontSize: "1.1rem",
    // CHANGE 1: Dark text is required for light pastel backgrounds
    color: "#1f2937", 
    border: "2px solid #000", // Optional: Adds a nice definition like your other pages
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: "600",
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
      <h1 style={{ fontSize: "3rem", marginBottom: "0.5rem", color: "#1f2937", textAlign: "center" }}>
        Employeah
      </h1>
      <p style={{ fontSize: "1.1rem", color: "#6b7280", marginBottom: "3rem", textAlign: "center" }}>
        Explore job market trends, find positions matching your skills, and discover how skill demand evolves over time.
      </p>

      {/* Navigation buttons */}
      <section style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "3rem" }}>
        
        {/* Search by Skills button (Pastel Blue) */}
        <button
          style={{ ...buttonStyle, background: "#93c5fd" }} // CHANGE 2: Pastel Blue
          onClick={() => navigate("/search/skills")}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          Search by Skills
        </button>

        {/* Search by Jobs button (Pastel Green - Matches SearchByJob page) */}
        <button
          style={{ ...buttonStyle, background: "#6ee7b7" }} // CHANGE 3: Pastel Green
          onClick={() => navigate("/search/job")}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          Search by Jobs
        </button>

        {/* Historical Data button (Pastel Purple - Matches HistoricalStats page) */}
        <button
          style={{ ...buttonStyle, background: "#d1c4e9" }} // CHANGE 4: Pastel Purple
          onClick={() => navigate("/historical")}
          onMouseEnter={(e) => e.target.style.transform = "translateY(-2px)"}
          onMouseLeave={(e) => e.target.style.transform = "translateY(0)"}
        >
          Historical Data
        </button>
      </section>
    </main>
  );
}

export default HomePage;