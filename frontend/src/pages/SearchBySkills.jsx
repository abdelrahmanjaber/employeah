import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations, getSkills, reportJobsBySkills } from "../lib/apiClient";

/* THIS IS THE SEARCH BY SKILLS PAGE
  --------------------------------
  It allows users to input their skills and optional location to find matching job postings.
  The results include a breakdown of job fields that match the skills and a list of recent announcements.
*/

// ============================================================================
// CONFIGURATION
// ============================================================================
// Colors for Segments
const PIE_COLORS = [
  "#86efac", "#fde047", "#93c5fd", "#fca5a5", 
  "#d8b4fe", "#fdba74", "#cbd5e1", "#6ee7b7", 
  "#f9a8d4", "#c4b5fd", "#94a3b8", "#a7f3d0"
];

// Time Limit Options
const TIME_LIMITS = [
  { value: "1w", label: "Last week" },
  { value: "2w", label: "Last 2 weeks" },
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" }
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SearchBySkills() {
  const navigate = useNavigate();
  
  // ========== STATE ==========
  
  // Skills Input State
  const [selectedSkills, setSelectedSkills] = useState([]); // Array of selected skills
  const [skillInput, setSkillInput] = useState(""); // Current text input for skills
  const [showSkillSugg, setShowSkillSugg] = useState(false); // Show/hide skill suggestions

  // Location Input State
  const [locationInput, setLocationInput] = useState(""); // Current text input for location
  const [showLocationSugg, setShowLocationSugg] = useState(false); // Show/hide location suggestions
  // Other Form State
  const [timeLimit, setTimeLimit] = useState("3m"); // Default time limit
  
  // Cached datasets for session
  const [allSkills, setAllSkills] = useState([]); // Full skills list for client-side filtering
  
  // UI State
  const [hasSearched, setHasSearched] = useState(false); // Whether a search has been performed
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [results, setResults] = useState(null); // Search results

  const [availableLocations, setAvailableLocations] = useState([]); // Cached locations for suggestions
  const [skillSuggestions, setSkillSuggestions] = useState([]); // Skill suggestions based on input

  // Resolve possible URL fields from API result objects
  const getJobUrl = (job) => {
    if (!job) return "#"; // Return placeholder if job is null
    if (job.url) return job.url; // Return URL if present
    if (job.link) return job.link; // Return link if present
    if (job.job_link) return job.job_link; // Return job_link if present
    if (job.data_source) {
      if (typeof job.data_source === 'string') return job.data_source; // Return data_source if it's a string
      if (job.data_source.link) return job.data_source.link; // Return link from data_source object
    }
    if (job.data_sources && Array.isArray(job.data_sources) && job.data_sources.length > 0) {
      const ds = job.data_sources[0];
      return ds && ds.link ? ds.link : (ds && ds.name ? ds.name : "#"); // Return link or name from first data_source
    }
    return "#"; // Fallback to placeholder
  };

  // ========== FILTERED SUGGESTIONS ==========
 /*  Load available locations on mount and cache in session storage */
  useEffect(() => {
    // Try session cache first
    const cachedLoc = sessionStorage.getItem("locations_cache");
    // if cache exists, load it
    if (cachedLoc) {
      try {
        setAvailableLocations(JSON.parse(cachedLoc)); // Load from cache
      } catch (e) { // if corrupted, remove it
        sessionStorage.removeItem("locations_cache"); // Remove corrupted cache
      }
    }

    // Fetch and cache locations if not present
    if (!cachedLoc) { // Fetch from API
      getLocations() // getLocations API call
        .then((locs) => {
          const arr = locs || []; // Ensure array
          setAvailableLocations(arr); // Set state
          try { sessionStorage.setItem("locations_cache", JSON.stringify(arr)); } catch (e) {} 
        }) // Set cache 
        .catch((err) => console.error("Failed to load locations:", err)); // Log errors
    }
  }, []); // Run only once on mount

  // Restore State on Mount
  useEffect(() => {
    const savedSkills = sessionStorage.getItem("sbs_skills"); // Get saved skills from session storage
    if (savedSkills) setSelectedSkills(JSON.parse(savedSkills)); // Parse and set selected skills

    const savedLoc = sessionStorage.getItem("sbs_location"); // Get saved location from session storage
    if (savedLoc) setLocationInput(savedLoc);

    const savedTime = sessionStorage.getItem("sbs_timeLimit"); // Get saved time limit from session storage
    if (savedTime) setTimeLimit(savedTime);
    
    // Explicitly restore results if available
    const savedResults = sessionStorage.getItem("sbs_results");
    if (savedResults) { // If previous results exist
      try {
        setResults(JSON.parse(savedResults));  // Parse and set previous results
        setHasSearched(true); // Mark that a search has been performed
      } catch(e) { console.error(e);} // Log parsing errors
    }
  }, []);

  useEffect(() => { // Update skill suggestions when input changes
    if (!skillInput) {
      setSkillSuggestions([]); // Clear suggestions if input is empty
      return;
    }

    const t = setTimeout(() => {
      // If we have a cached full skills list, filter client-side (avoid API per keystroke)
      if (allSkills && allSkills.length > 0) {
        const filtered = allSkills.filter((s) => s.toLowerCase().includes(skillInput.toLowerCase())); // Filter skills
        setSkillSuggestions(filtered.filter((s) => !selectedSkills.includes(s)).slice(0, 20)); // Exclude selected skills and limit to 20
        return; // Exit early to avoid API call
      }

      // Fallback to server search
      getSkills({ q: skillInput, limit: 20 }) // getSkills API call
        .then((skills) => setSkillSuggestions((skills || []).filter((s) => !selectedSkills.includes(s)))) // Exclude selected skills
        .catch((err) => console.error("Failed to load skills:", err)); // Log errors
    }, 200);
    return () => clearTimeout(t); // Debounce timeout
  }, [skillInput, selectedSkills]); // Run when skillInput or selectedSkills change

  // Prefetch full skills list on mount and store in session cache for the session
  useEffect(() => {
    const cached = sessionStorage.getItem("skills_cache"); // Check session cache
    if (cached) { // If cache exists, load it
      try {
        setAllSkills(JSON.parse(cached)); // Load from cache
      } catch (e) { // if corrupted, remove it
        sessionStorage.removeItem("skills_cache");
      }
    }

    if (!cached) {
      // attempt to fetch a large list once
      getSkills({ q: "", limit: 1000 }) // getSkills API call
        .then((skills) => { // Fetch up to 1000 skills
          const arr = skills || []; 
          setAllSkills(arr); // Set state
          try { sessionStorage.setItem("skills_cache", JSON.stringify(arr)); } catch (e) {} 
        })
        .catch((err) => console.error("Failed to prefetch skills:", err)); // Log errors
    }
  }, []); // Run only once on mount

  // Filtered Suggestions
  const filteredSkillSuggestions = useMemo(
    () => (skillSuggestions || []).filter((s) => s.toLowerCase().includes(skillInput.toLowerCase())), // Filter skill suggestions based on input
    [skillSuggestions, skillInput] // Memoize filtered skill suggestions
  );

  // Filtered Location Suggestions
  const filteredLocationSuggestions = useMemo(
    () => (availableLocations || []).filter((l) => l.toLowerCase().includes(locationInput.toLowerCase())), // Filter location suggestions based on input
    [availableLocations, locationInput] // Memoize filtered location suggestions
  );

  // ========== HANDLERS ==========

  // Skill Handlers
  const handleAddSkill = (skill) => {
    if (skill && !selectedSkills.includes(skill)) { // Avoid duplicates
      const newSkills = [...selectedSkills, skill]; // Add new skill
      setSelectedSkills(newSkills); // Update state
      setSkillInput(""); // Clear input
      setShowSkillSugg(false); // Hide suggestions
      // Persist immediately on change if desired, but handleSearch does it too
      // sessionStorage.setItem("sbs_skills", JSON.stringify(newSkills));
    }
  };

  // Remove Skill Handler
  const handleRemoveSkill = (skillToRemove) => { // Remove skill from selected list
    const newSkills = selectedSkills.filter(s => s !== skillToRemove); // Filter out the skill to remove
    setSelectedSkills(newSkills); // Update state
    // sessionStorage.setItem("sbs_skills", JSON.stringify(newSkills));
  };

  // Location Handlers
  const handleSelectLocation = (loc) => {
    setLocationInput(loc);
    setShowLocationSugg(false);
    // sessionStorage.setItem("sbs_location", loc);
  };

  // Search Handler
  const handleSearch = async () => { // Perform search based on selected skills and location
    if (selectedSkills.length === 0) {
      alert("Please select at least one skill."); // at least one skill is required
      return;
    }
    // Clear previous results immediately (do not merge)
    setResults(null);
    setLoading(true);
    setHasSearched(true);
    
    // Save search params
    sessionStorage.setItem("sbs_skills", JSON.stringify(selectedSkills));
    sessionStorage.setItem("sbs_location", locationInput);
    sessionStorage.setItem("sbs_timeLimit", timeLimit);

    try {
      // API Call to get jobs by skills
      const resp = await reportJobsBySkills({
        skills: selectedSkills,
        location: locationInput || null,
        timeWindow: timeLimit,
      });

      // Process response data and set results
      const resData = {
        jobFields: (resp?.job_titles || []).map((j) => ({ name: j.name, percent: j.percent, count: j.count })), // Map job titles to desired format
        topField: resp?.top_job_title || null, // Top job title
        lastAnnouncements: resp?.last_announcements || [], // Recent job announcements
      };
      
      setResults(resData);
      sessionStorage.setItem("sbs_results", JSON.stringify(resData)); // Cache results

    } catch (err) { // Handle errors
      console.error(err); // Log error
      setResults({ jobFields: [], topField: null, lastAnnouncements: [] }); // Set empty results on error
    } finally {
      setLoading(false); // Clear loading state
    }
  };

  const handleFieldClick = (fieldName) => { // Handle click on a job field to navigate to detailed analysis
    const params = new URLSearchParams(); // Create URLSearchParams object
    params.set("field", fieldName); // Set job field parameter
    if(selectedSkills.length) params.set("skills", selectedSkills.join(",")); // Set skills parameter
    if(locationInput) params.set("location", locationInput); // Set location parameter
    if(timeLimit) params.set("timeLimit", timeLimit); // Set time limit parameter
    navigate(`/field-analysis?${params.toString()}`); // Navigate to Field Analysis page with parameters
  };

  // ========== RENDER HELPERS ==========

  const renderSearchBar = () => (
    // Render the search bar section with skills and location inputs
    <section style={{ display: "flex", gap: "15px", justifyContent: "center", alignItems: "end", marginBottom: "3rem" }}>
      
      {/* Skills Input Section */}
      <div style={{ position: "relative", width: "400px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "1.2rem" }}>Your Skills</label>
        <div style={{ padding: "10px", width: "100%", border: "2px solid #000", fontSize: "1rem", borderRadius: "8px", backgroundColor: "#fff", minHeight: "56px" }}>
          
          {/* Selected Skills Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: selectedSkills.length > 0 ? "8px" : "0" }}>
            {selectedSkills.map(skill => (
              <span key={skill} style={{ 
                backgroundColor: "#dbeafe", color: "#1e40af", padding: "4px 10px", borderRadius: "16px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" 
              }}>
                {skill}
                <button 
                // Button to remove a selected skill
                  onClick={() => handleRemoveSkill(skill)}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#1e40af", fontWeight: "bold", padding: 0, fontSize: "16px", lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <input
          // Skill Input Field
            type="text"
            placeholder="Type to add a skill..."
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value); // Update input value
              setShowSkillSugg(true); // Show suggestions
            }}
            onFocus={() => setShowSkillSugg(true)} // Show suggestions on focus
            onBlur={() => setTimeout(() => setShowSkillSugg(false), 200)} // Hide suggestions on blur with delay
            style={{ 
              width: "100%", border: "none", outline: "none", fontSize: "1rem" 
            }}
          />
        </div>
          
        {/* Suggestions Dropdown */}
        {showSkillSugg && skillInput && filteredSkillSuggestions.length > 0 && (
          <ul style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
            background: "#fff", border: "2px solid #000", borderTop: "none",
            listStyle: "none", padding: 0, margin: 0,
            maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px"
          }}>
            {filteredSkillSuggestions.map(skill => (
              <li 
                key={skill}
                onClick={() => handleAddSkill(skill)}
                style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                {skill}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Location Input Section */}
      <div style={{ position: "relative", width: "300px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "1.2rem" }}>Location</label>
        <input
          type="text"
          placeholder="e.g. Munich"
          value={locationInput}
          onChange={(e) => {
            setLocationInput(e.target.value);
            setShowLocationSugg(true);
          }}
          onFocus={() => setShowLocationSugg(true)}
          onBlur={() => setTimeout(() => setShowLocationSugg(false), 200)}
          style={{ padding: "15px", width: "100%", border: "2px solid #000", fontSize: "1rem", borderRadius: "8px" }}
        />
        
        {/* Location Suggestions */}
        {showLocationSugg && locationInput && filteredLocationSuggestions.length > 0 && (
          <ul style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
            background: "#fff", border: "2px solid #000", borderTop: "none",
            listStyle: "none", padding: 0, margin: 0,
            maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px"
          }}>
            {filteredLocationSuggestions.map(loc => (
              <li 
                key={loc}
                onClick={() => handleSelectLocation(loc)}
                style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#eff6ff"}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
              >
                {loc}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Time Limit */}
      <div style={{ position: "relative", width: "200px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "1.2rem" }}>Time Limit</label>
        <select
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
          style={{ 
            padding: "15px", width: "100%", border: "2px solid #000", fontSize: "1rem", borderRadius: "8px", backgroundColor: "white", appearance: "none"
          }}
        >
          {TIME_LIMITS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {/* Custom arrow for select if appearance is none, but let's keep it simple for now or rely on browser default if we remove appearance: none or add arrow */}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={loading}
        style={{
          padding: "15px 30px",
          backgroundColor: "#93c5fd",
          color: "#000",
          border: "2px solid #000",
          borderRadius: "8px",
          fontSize: "1.1rem",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          marginBottom: "1px"
        }}
      >
        {loading ? "Searching..." : "Search"}
      </button>
    </section>
  );

  const renderResultsView = () => {
    if (!results) return null;

    // Filter job fields > 2%
    const filteredFields = results.jobFields.filter(f => f.percent > 2);

    return (
      <div style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}>
        {/* LEFT SIDE: Scrollable List of Job Fields */}
        <div style={{ flex: 1, minWidth: "300px", backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>Matching Jobs by Job Field</h3>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
            Showing fields with &gt; 2% match. Click to view details.
          </p>
        
          <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "10px" }}> {/* Scrollable container */}
            {filteredFields.map((field, idx) => ( 
              <div 
                key={field.name}
                onClick={() => handleFieldClick(field.name)}
                style={{ 
                  padding: "15px", 
                  marginBottom: "10px", 
                  borderRadius: "8px", 
                  border: "1px solid #e2e8f0", 
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backgroundColor: "#fff"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.borderColor = "#cbd5e1";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "#fff";
                  e.currentTarget.style.borderColor = "#e2e8f0";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "600", color: "#0f172a" }}>{field.name}</span>
                  <span style={{ fontWeight: "bold", color: "#2563eb" }}>{field.percent}%</span>
                </div>
                {/* Progress Bar */}
                <div style={{ width: "100%", height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${field.percent}%`, height: "100%", backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "5px" }}>
                  {field.count} matching announcements
                </div>
              </div>
            ))}
            
            {filteredFields.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px", color: "#94a3b8" }}>
                No job fields found with significant matches.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDE: Stats & List */}
        <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Top Field Card */}
          <div style={{ backgroundColor: "#eff6ff", padding: "20px", borderRadius: "12px", borderLeft: "5px solid #2563eb" }}>
            <h3 style={{ margin: "0 0 10px 0", color: "#1e40af" }}>Top Field</h3>
            <p style={{ fontSize: "24px", fontWeight: "bold", margin: 0, color: "#1e3a8a" }}>
              {results.topField}
            </p>
            <p style={{ margin: "5px 0 0 0", color: "#60a5fa" }}>
              Highest number of matching announcements
            </p>
          </div>

          {/* Last 5 Announcements */}
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", flex: 1 }}>
            <h3 style={{ marginTop: 0, color: "#333" }}>Last 5 Announcements</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {results.lastAnnouncements.map((job) => (
                <a 
                  key={job.id} 
                  href={getJobUrl(job)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    display: "block", 
                    padding: "12px", 
                    borderRadius: "8px", 
                    backgroundColor: "#f8fafc", 
                    textDecoration: "none",
                    border: "1px solid #e2e8f0",
                    transition: "transform 0.1s"
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = "translateX(5px)"}
                  onMouseOut={(e) => e.currentTarget.style.transform = "translateX(0)"}
                >
                  <div style={{ fontWeight: "600", color: "#0f172a" }}>{job.title}</div>
                  <div style={{ fontSize: "14px", color: "#64748b", display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
                    <span>{job.company}</span>
                    <span>{job.date}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      
      <button // Back Button
        onClick={() => navigate(-1)} 
        style={{ 
          cursor: "pointer", marginBottom: "1rem", background: "#eff6ff", 
          border: "1px solid #2563eb", padding: "5px 15px", borderRadius: "4px", color: "#1e40af"
        }}
      >
        ← Back
      </button>

      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
          </svg>
          <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#1f2937" }}>See where your skills can take you</h1>
        </div>
        <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "0.5rem" }}>
          Enter your skills to see which job positions match your profile.
        </p>
      </header>

      {/* SEARCH BAR */}
      {renderSearchBar()}

      {/* Content Area */}
      <div style={{ minHeight: "400px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
            Loading analysis...
          </div>
        )}

        {!loading && !hasSearched && (
          <div style={{ textAlign: "center", padding: "50px", color: "#94a3b8", border: "2px dashed #e2e8f0", borderRadius: "12px" }}>
            Enter your skills and location above to start the analysis.
          </div>
        )}

        {!loading && hasSearched && renderResultsView()}
      </div>
    </div>
  );
}

export default SearchBySkills;
