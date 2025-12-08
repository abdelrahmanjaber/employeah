import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchBySkills as mockSearchBySkills } from "../lib/mockApi";

/**
 * ============================================================================
 * SearchBySkills Component - Find jobs matching user's skills
 * ============================================================================
 * 
 * PURPOSE:
 * Users enter their technical skills (e.g., "Python", "SQL") and optionally
 * a location. The component displays job titles where these skills are in demand,
 * with a "match percentage" showing how many announcements for that job require
 * at least one of the user's skills.
 * 
 * USER WORKFLOW:
 * 1. User checks multiple skills from the list (e.g., Python, Docker, SQL)
 * 2. User optionally selects a location
 * 3. User clicks "Search"
 * 4. Component calls searchBySkills() and displays:
 *    - Total number of matching job titles
 *    - For each job title:
 *      * Total announcements for that job
 *      * How many announcements require at least one user skill
 *      * Match percentage: (matching / total) * 100
 * 
 * EXAMPLE RESULT:
 * "Found 4 job(s) in Remote matching: Python, Docker"
 * Results:
 * 1. Backend Developer - 3 announces • 2 matches - 67%
 * 2. DevOps Engineer - 2 announces • 2 matches - 100%
 * 3. Data Engineer - 1 announces • 1 matches - 100%
 * 4. Data Scientist - 1 announces • 0 matches - 0%
 * 
 * KEY CONCEPT - "At least ONE skill":
 * A job announcement "matches" if ANY of its required skills are in the user's
 * selected skills. For example:
 * - User skills: [Python, SQL, Docker]
 * - Backend Developer announcement requires: [Node.js, Python, PostgreSQL, Docker]
 * - Result: MATCHES (because Python and Docker are in both lists)
 * 
 * DATA SOURCE:
 * - Always uses mockSearchBySkills() from mockApi.js (frontend-only demo)
 * - No backend or .env config required
 */

// ============================================================================
// CONFIGURATION
// ============================================================================
// Pure-frontend demo: always use mockSearchBySkills (no API calls).

// ============================================================================
// DROPDOWN/CHECKBOX OPTIONS
// ============================================================================

// Available locations for filtering
const LOCATIONS = ["London", "Remote", "Milan", "Berlin"];

// Available skills for user selection (shown as checkboxes)
const SKILLS = ["Python", "React", "SQL", "Docker", "AWS", "Pandas", "JavaScript", "TypeScript", "Machine Learning", "Kubernetes"];

// ============================================================================
// COMPONENT
// ============================================================================

function SearchBySkills() {
  const navigate = useNavigate();
  
  // ========== FORM STATE ==========
  // What the user has selected
  const [location, setLocation] = useState("");            // Selected location (string)
  const [selectedSkills, setSelectedSkills] = useState([]);  // Selected skills (array of strings)
  
  // ========== UI STATE ==========
  // Controls the display of the page
  const [loading, setLoading] = useState(false);   // True while fetching data
  const [results, setResults] = useState(null);    // API response data
  const [error, setError] = useState(null);        // Error message if request fails

  /**
   * toggleSkill() - Add or remove a skill from selection
   * 
   * WHAT IT DOES:
   * - If skill is already in selectedSkills, remove it
   * - If skill is not in selectedSkills, add it
   * 
   * EXAMPLE:
   * selectedSkills = ["Python", "SQL"]
   * toggleSkill("Docker") → selectedSkills = ["Python", "SQL", "Docker"]
   * toggleSkill("Python") → selectedSkills = ["SQL", "Docker"]
   * 
   * IMPLEMENTATION:
   * Uses filter() to remove, or spread operator + array to add
   */
  const toggleSkill = (skill) => {
    setSelectedSkills((prev) => 
      prev.includes(skill) 
        ? prev.filter((s) => s !== skill)  // Remove if already selected
        : [...prev, skill]                 // Add if not selected
    );
  };

  /**
   * sendQuery() - Handle search request
   * 
   * WHAT IT DOES:
   * 1. Clear previous results and errors
   * 2. Set loading = true (button disables, text changes to "Searching...")
   * 3. Build parameters: skills (as comma-separated) and location
   * 4. Call mockSearchBySkills (or real API if USE_MOCKS=false)
   * 5. Display results or error message
   * 6. Set loading = false (button re-enables)
   * 
   * FLOW:
   * User clicks "Search" → sendQuery() runs → setLoading(true)
   * → Mock API processes skills and filters announcements → setResults(data)
   * → UI re-renders with matching jobs
   * 
   * ERROR HANDLING:
   * If fetch fails or API returns error, catch block sets error state
   * and displays red error box to user
   */
  const sendQuery = async () => {
    setLoading(true);      // Disable button, show "Searching..."
    setError(null);        // Clear previous errors
    setResults(null);      // Clear previous results

    try {
      // Pure mock call (frontend only)
      const data = await mockSearchBySkills({ location, skills: selectedSkills });
      
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
      setLoading(false);  // Re-enable button, hide "Searching..."
    }
  };

  // Disable search button unless at least location or skills are selected
  const canSend = location || selectedSkills.length > 0;

  return (
    <main style={{ padding: "2rem", maxWidth: "960px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
      {/* Back button to return to previous page */}
      <button onClick={() => navigate(-1)} style={{ marginBottom: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}>← Back</button>
      
      <h1>Search by Skills</h1>
      <p>Select skills and location to search for job postings.</p>

      {/* Search filters section */}
      <section style={{ marginTop: "1rem", marginBottom: "1rem", padding: "1rem", border: "1px solid #e5e7eb", borderRadius: 8, maxWidth: 760, background: "#ffffff" }}>
        {/* Location dropdown (optional) */}
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ marginRight: 8, fontWeight: 600 }}>Location</label>
          <select value={location} onChange={(e) => setLocation(e.target.value)} style={{ padding: "0.5rem" }}>
            <option value="">Any location</option>
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Skills checkboxes */}
        <div style={{ marginTop: "1rem" }}>
          <div style={{ marginBottom: 8, fontWeight: 600 }}>Select Skills</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SKILLS.map((s) => (
              <label 
                key={s} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6, 
                  padding: "0.4rem 0.8rem", 
                  border: "1px solid #d1d5db", 
                  borderRadius: 4, 
                  background: selectedSkills.includes(s) ? "#dbeafe" : "#f3f4f6", 
                  cursor: "pointer" 
                }}
              >
                <input type="checkbox" checked={selectedSkills.includes(s)} onChange={() => toggleSkill(s)} />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Search button */}
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button 
            onClick={sendQuery} 
            disabled={!canSend || loading} 
            style={{ 
              padding: "0.5rem 1rem", 
              background: "#3b82f6", 
              color: "#fff", 
              border: "none", 
              borderRadius: 4, 
              cursor: canSend && !loading ? "pointer" : "not-allowed", 
              opacity: canSend && !loading ? 1 : 0.5 
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </section>

      {/* Results section */}
      <section style={{ maxWidth: 760 }}>
        <h2>Results</h2>
        
        {/* Error message display */}
        {error && (
          <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "0.75rem", borderRadius: 4 }}>
            Error: {error}
          </div>
        )}

        {/* Results display */}
        {results && results.success ? (
          <div>
            {/* Summary paragraph showing number of matching job titles */}
            <p style={{ marginBottom: "0.5rem", fontWeight: 600 }}>
              Found {results.total_jobs} job(s)
              {results.location && ` in ${results.location}`}
              {results.user_skills && results.user_skills.length > 0 && ` matching: ${results.user_skills.join(", ")}`}
            </p>
            
            {/* Jobs list or empty state */}
            {results.total_jobs > 0 ? (
              <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                {Object.entries(results.jobs || {}).map(([title, info]) => (
                  <li key={title} style={{ padding: "0.75rem", marginBottom: "0.5rem", border: "1px solid #e5e7eb", borderRadius: 4, background: "#f9fafb", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Job title and match statistics */}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{title}</div>
                      <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.3rem" }}>
                        {info.count} announce{info.count !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Right side: percentage badge showing match rate */}
                    <div style={{ marginLeft: 16, textAlign: 'right', minWidth: '80px' }}>
                      <div style={{ fontWeight: 700, fontSize: "1.3rem", color: '#10b981' }}>
                        {info.percentage}%
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: "#666" }}>No jobs found matching your criteria.</p>
            )}
          </div>
        ) : !loading && !error ? (
          <div style={{ color: "#666" }}>Use the filters above and click "Search" to find jobs.</div>
        ) : null}
      </section>
    </main>
  );
}

export default SearchBySkills;
