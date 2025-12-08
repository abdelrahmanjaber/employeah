import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getHistoricalStats as mockGetHistoricalStats } from "../lib/mockApi";

// Available locations and jobs
const LOCATIONS = ["London", "Remote", "Milan", "Berlin"];
const JOBS = ["Data Scientist", "Backend Developer", "Frontend Developer", "Data Engineer"];

function HistoricalStats() {
  const navigate = useNavigate();

  // Form state
  const [job, setJob] = useState("");
  const [location, setLocation] = useState("");

  // UI state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const sendQuery = async () => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const data = await mockGetHistoricalStats({ job, location });
    // const [location, setLocation] = useState("");
    } catch (err) {
      setError(err.message || "Failed to fetch results");
      console.error("API error:", err);
    } finally {
      setLoading(false);
    }
  };

  const canSend = job || location;

  return (
    <main style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}>← Back</button>

      <h1>Historical Skill Trends</h1>
      <p>Historical data on skill demand for selected jobs and locations, older than 3 months.</p>

      <section style={{ marginTop: "1rem", marginBottom: "1rem", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, maxWidth: 760, background: "#ffffff" }}>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 8, fontWeight: 600 }}>Job Title</label>
          <select value={job} onChange={(e) => setJob(e.target.value)} style={{ padding: "0.5rem" }}>
            <option value="">Select a job</option>
            {JOBS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: "1rem" }}>
          <label style={{ marginRight: 8, fontWeight: 600 }}>Location (Optional)</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ padding: "0.5rem" }}>
            <option value="">Any location</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            onClick={sendQuery}
            disabled={!canSend || loading}
            style={{
              padding: "0.5rem 1rem",
              background: "#10b981",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: canSend && !loading ? "pointer" : "not-allowed",
              opacity: canSend && !loading ? 1 : 0.5
            }}
          >
            {loading ? "Loading..." : "Get Statistics"}
          </button>
        </div>
      </section>

      <section style={{ maxWidth: 760 }}>
        <h2>Skill Statistics</h2>

        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.75rem", borderRadius: 4 }}>
            Error: {error}
          </div>
        )}

        {results && results.success ? (
          <div>
            <p style={{ marginBottom: "1rem", fontWeight: 600 }}>
              {results.periods.length} period(s) found
              {results.job && ` for ${results.job}`}
              {results.location && ` in ${results.location}`}
            </p>

            {results.periods.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {results.periods.map((period) => (
                  <div key={period.period} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "0.75rem", background: "#f9fafb" }}>
                    <div style={{ fontWeight: 700 }}>{period.period}</div>
                    <div style={{ fontSize: "0.9rem", color: "#555", marginTop: 4 }}>{period.jobs_count} job(s)</div>
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: "1.2rem" }}>
                      {Object.entries(period.skills || {}).map(([skill, info]) => (
                        <li key={skill}>
                          <strong>{skill}</strong> — {info.count} posting(s) • {info.percentage}%
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "#666" }}>No historical data found for these filters.</p>
            )}
          </div>
        ) : !loading && !error ? (
          <div style={{ color: "#fa0404ff" }}>Function not available at the moment</div>
        ) : null}
      </section>
    </main>
  );
}

export default HistoricalStats;
