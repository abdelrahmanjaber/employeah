import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchByJob as mockSearchByJob } from "../lib/mockApi";

/**
 * ============================================================================
 * SearchByJob Component - Search skill requirements by job title
 * ============================================================================
 * 
 * PURPOSE:
 * Users search for a specific job title (e.g., "Data Scientist") and optionally
 * filter by location. The component displays which skills are required for that
 * job and how frequently they appear (as percentages).
 * 
 * USER WORKFLOW:
 * 1. User selects a job title from dropdown (required)
 * 2. User optionally selects a location
 * 3. User clicks "Get Statistics"
 * 4. Component calls searchByJob() and displays:
 *    - Total number of matching job announcements
 *    - Percentage that are remote
 *    - List of required skills with their frequency percentages
 * 
 * EXAMPLE RESULT:
 * "5 job(s) found for Data Scientist in London"
 * Top Skills Required:
 * 1. Python — 5 postings • 100%
 * 2. SQL — 3 postings • 60%
 * 3. Machine Learning — 2 postings • 40%
 * 
 * DATA SOURCE:
 * - Always uses mockSearchByJob() from mockApi.js (frontend-only demo)
 * - No backend or .env config required
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
// Pure-frontend demo: we always use the mock data/functions. No API calls.

// ============================================================================
// DROPDOWN OPTIONS
// ============================================================================

// Available locations for filtering
const LOCATIONS = ["London", "Remote", "Milan", "Berlin"];

// Available job titles for searching
const JOBS = ["Data Scientist", "Backend Developer", "Frontend Developer", "Data Engineer"];

// ============================================================================
// COMPONENT
// ============================================================================

function SearchByJob() {
  const navigate = useNavigate();
  
  // ========== FORM STATE ==========
  // What the user has selected in the dropdowns
  const [job, setJob] = useState("");           // Selected job title (string)
  const [location, setLocation] = useState("");  // Selected location (string)
  
  // ========== UI STATE ==========
  // Controls the display of the page
  const [loading, setLoading] = useState(false);   // True while fetching data
  const [results, setResults] = useState(null);    // API response data
  const [error, setError] = useState(null);        // Error message if request fails

  /**
   * sendQuery() - Handle search request
   * 
   * WHAT IT DOES:
   * 1. Clear previous results and errors
   * 2. Set loading = true (button disables, text changes to "Loading...")
  * 3. Call mockSearchByJob (frontend only)
  * 4. Display results or error message
  * 5. Set loading = false (button re-enables)
   * 
   * FLOW:
   * User clicks "Get Statistics" → sendQuery() runs → setLoading(true)
   * → Mock API returns after 250ms delay → setResults(data) → UI re-renders
   * 
   * ERROR HANDLING:
   * If fetch fails or API returns error, catch block sets error state
   * and displays red error box to user
   */
  const sendQuery = async () => {
    setLoading(true);      // Disable button, show "Loading..."
    setError(null);        // Clear previous errors
    setResults(null);      // Clear previous results

    try {
      // Pure mock call (frontend only)
      const data = await mockSearchByJob({ job, location });
      
      // ========== SUCCESS ==========
      // Store results in state, UI will re-render and display them
      setResults(data);
    } catch (err) {
      // ========== ERROR ==========
      // Store error message, UI will show red error box
      setError(err.message || "Failed to fetch results");
      console.error("API error:", err);
    } finally {
      // Always run this, even if error occurred
      setLoading(false);  // Re-enable button, hide "Loading..."
    }
  };

  // Disable search button unless at least job or location is selected
  const canSend = job || location;

  return (
    <main style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      {/* Back button to return to previous page */}
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}>← Back</button>
      
      <h1>Search by Job</h1>
      <p>Select a job and optionally a location to see which skills are most commonly requested.</p>

      {/* Search filters section */}
      <section style={{ marginTop: "1rem", marginBottom: "1rem", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, maxWidth: 760, background: "#ffffff" }}>
        {/* Job title dropdown */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 8, fontWeight: 600 }}>Job Title</label>
          <select value={job} onChange={(e) => setJob(e.target.value)} style={{ padding: "0.5rem" }}>
            <option value="">Select a job</option>
            {JOBS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>

        {/* Location dropdown (optional) */}
        <div style={{ marginTop: "1rem" }}>
          <label style={{ marginRight: 8, fontWeight: 600 }}>Location (Optional)</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ padding: "0.5rem" }}>
            <option value="">Any location</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Search button */}
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

      {/* Results section */}
      <section style={{ maxWidth: 760 }}>
        <h2>Skill Statistics</h2>
        
        {/* Error message display */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.75rem", borderRadius: 4 }}>
            Error: {error}
          </div>
        )}

        {/* Results display */}
        {results && results.success ? (
          <div>
            {/* Summary paragraph */}
            <p style={{ marginBottom: "1rem", fontWeight: 600 }}>
              {results.total_jobs} job(s) found
              {results.job && ` for ${results.job}`}
              {results.location && ` in ${results.location}`}
            </p>

            {/* Skills list or empty state */}
            {results.total_jobs > 0 ? (
              <div>
                <h3 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Top Skills Required</h3>
                {/* Display skills with counts and percentages */}
                <ol style={{ paddingLeft: "1.5rem" }}>
                  {Object.entries(results.skills || {}).map(([skill, info]) => (
                    <li key={skill} style={{ marginBottom: "0.5rem" }}>
                      <strong>{skill}</strong> — {info.count} posting(s) • {info.percentage}%
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p style={{ color: "#666" }}>No jobs found matching your criteria.</p>
            )}
          </div>
        ) : !loading && !error ? (
          <div style={{ color: "#666" }}>Select a job and click "Get Statistics" to see required skills.</div>
        ) : null}
      </section>
    </main>
  );
}

export default SearchByJob;
