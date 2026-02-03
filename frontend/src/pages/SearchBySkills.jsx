import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { getSkills, reportFieldsBySkills, reportLocationsBySkills } from "../lib/apiClient";


/* THIS IS THE SKILL-TO-JOB SEARCH PAGE
  --------------------------------------
  This page flips the usual logic. Instead of searching for a job title,
  the user enters the SKILLS they possess (e.g., "Python", "React").
  
  The app then:
  1. Calculates which Job Fields match those skills best (e.g., "Frontend Dev").
  2. Shows the "Top Field" match statistics.
  3. Lists the 5 most recent real job postings that require those specific skills.
*/

// CONFIGURATION
const PIE_COLORS = [
  "#86efac", "#fde047", "#93c5fd", "#fca5a5", 
  "#d8b4fe", "#fdba74", "#cbd5e1", "#6ee7b7", 
  "#f9a8d4", "#c4b5fd", "#94a3b8", "#a7f3d0"
];

const TIME_LIMITS = [
  { value: "1w", label: "Last week" },
  { value: "2w", label: "Last 2 weeks" },
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" }
];

// MAIN COMPONENT


function SearchBySkills() {
  const navigate = useNavigate();
  
  // STATE 
  // We need to manage a list of selected skills (the "chips" user adds),
  // plus the text inputs for searching new skills/locations.
  
  // Skills Input State
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillInput, setSkillInput] = useState("");
  const [showSkillSugg, setShowSkillSugg] = useState(false);

  // Location Input State
  const [locationInput, setLocationInput] = useState("");
  const [showLocationSugg, setShowLocationSugg] = useState(false);

  // Other Form State
  const [timeLimit, setTimeLimit] = useState("3m");
  
  // Cached datasets for session
  // UI State
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const [availableLocations, setAvailableLocations] = useState([]);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const autoSearchTimer = useRef(null);

  // Helper to extract a valid link from the messy API job object
  const getJobUrl = (job) => {
    if (!job) return "#";
    if (job.url) return job.url;
    if (job.link) return job.link;
    if (job.job_link) return job.job_link;
    if (job.data_source) {
      if (typeof job.data_source === 'string') return job.data_source;
      if (job.data_source.link) return job.data_source.link;
    }
    if (job.data_sources && Array.isArray(job.data_sources) && job.data_sources.length > 0) {
      const ds = job.data_sources[0];
      return ds && ds.link ? ds.link : (ds && ds.name ? ds.name : "#");
    }
    return "#";
  };

  useEffect(() => {
    if (!selectedSkills || selectedSkills.length === 0) {
      setAvailableLocations([]);
      return;
    }
    reportLocationsBySkills({ skills: selectedSkills, timeWindow: timeLimit })
      .then((locs) => setAvailableLocations(locs || []))
      .catch((err) => console.error("Failed to load locations:", err));
  }, [selectedSkills, timeLimit]);

  //UNCOMMENT WHEN DONE to get back to api logic!!
  // Restore State on Mount
  /*useEffect(() => {
    const savedSkills = sessionStorage.getItem("sbs_skills");
    if (savedSkills) setSelectedSkills(JSON.parse(savedSkills));

    const savedLoc = sessionStorage.getItem("sbs_location");
    if (savedLoc) setLocationInput(savedLoc);

    const savedTime = sessionStorage.getItem("sbs_timeLimit");
    if (savedTime) setTimeLimit(savedTime);
    
    // Explicitly restore results if available
    const savedResults = sessionStorage.getItem("sbs_results");
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
        setHasSearched(true);
      } catch(e) { console.error(e);}
    }
  }, []);
  */
  useEffect(() => {
    if (!skillInput) {
      setSkillSuggestions([]);
      return;
    }

    const t = setTimeout(() => {
      getSkills({ q: skillInput, limit: 20 })
        .then((skills) => setSkillSuggestions((skills || []).filter((s) => !selectedSkills.includes(s))))
        .catch((err) => console.error("Failed to load skills:", err));
    }, 200);
    return () => clearTimeout(t);
  }, [skillInput, selectedSkills]);
  const filteredSkillSuggestions = useMemo(
    () => (skillSuggestions || []).filter((s) => s.toLowerCase().includes(skillInput.toLowerCase())),
    [skillSuggestions, skillInput]
  );

  const filteredLocationSuggestions = useMemo(
    () => (availableLocations || []).filter((l) => l.toLowerCase().includes(locationInput.toLowerCase())),
    [availableLocations, locationInput]
  );

  // HANDLERS 

  // Add a skill chip when user clicks a suggestion
  const handleAddSkill = (skill) => {
    if (skill && !selectedSkills.includes(skill)) {
      const newSkills = [...selectedSkills, skill];
      setSelectedSkills(newSkills);
      setSkillInput("");
      setShowSkillSugg(false);
      // Persist immediately on change if desired, but handleSearch does it too
      // sessionStorage.setItem("sbs_skills", JSON.stringify(newSkills));
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const newSkills = selectedSkills.filter(s => s !== skillToRemove);
    setSelectedSkills(newSkills);
    // sessionStorage.setItem("sbs_skills", JSON.stringify(newSkills));
  };

  // Location Handlers
  const handleSelectLocation = (loc) => {
    setLocationInput(loc);
    setShowLocationSugg(false);
    // sessionStorage.setItem("sbs_location", loc);
  };

  // Search Handler
  const handleSearch = async () => {
    if (selectedSkills.length === 0) {
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
      const resp = await reportFieldsBySkills({
        skills: selectedSkills,
        location: locationInput || null,
        timeWindow: timeLimit,
      });

      const resData = {
        jobFields: (resp?.fields || []).map((f) => ({ name: f.name, percent: f.percent, count: f.count })),
        topField: resp?.top_field || null,
        lastAnnouncements: resp?.best_jobs || [],
      };
      
      setResults(resData);
      sessionStorage.setItem("sbs_results", JSON.stringify(resData));

    } catch (err) {
      console.error(err);
      setResults({ jobFields: [], topField: null, lastAnnouncements: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSkills || selectedSkills.length === 0) {
      setHasSearched(false);
      setResults(null);
      return;
    }

    if (autoSearchTimer.current) clearTimeout(autoSearchTimer.current);
    autoSearchTimer.current = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => {
      if (autoSearchTimer.current) clearTimeout(autoSearchTimer.current);
    };
  }, [selectedSkills, locationInput, timeLimit]);

  const handleFieldClick = (fieldName) => {
    const params = new URLSearchParams();
    params.set("field", fieldName);
    if(selectedSkills.length) params.set("skills", selectedSkills.join(","));
    if(locationInput) params.set("location", locationInput);
    if(timeLimit) params.set("timeLimit", timeLimit);
    navigate(`/field-analysis?${params.toString()}`);
  };

  // RENDER HELPERS

  const renderSearchBar = () => (
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
                  onClick={() => handleRemoveSkill(skill)}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#1e40af", fontWeight: "bold", padding: 0, fontSize: "16px", lineHeight: 1 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <input
            type="text"
            placeholder="Type to add a skill..."
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              setShowSkillSugg(true);
            }}
            onFocus={() => setShowSkillSugg(true)}
            onBlur={() => setTimeout(() => setShowSkillSugg(false), 200)}
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
          <h3 style={{ marginTop: 0, marginBottom: "20px", color: "#333" }}>Matching Job Fields</h3>
          <p style={{ color: "#64748b", fontSize: "14px", marginBottom: "20px" }}>
            Showing fields with &gt; 2% match. Click to view details.
          </p>
          
          <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "10px" }}>
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
              Best match based on your selected skills
            </p>
          </div>

          {/* Last 5 Announcements */}
          <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", flex: 1 }}>
            <h3 style={{ marginTop: 0, color: "#333" }}>Best Job Matches</h3>
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
                    <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {typeof job.match_percent === "number" && (
                        <span style={{ color: "#2563eb", fontWeight: 700 }}>{job.match_percent}%</span>
                      )}
                      <span>{job.date}</span>
                    </span>
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
      
      <button 
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
