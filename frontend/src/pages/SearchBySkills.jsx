import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLocations, getSkills, reportJobTitleDetails, reportJobsBySkills } from "../lib/apiClient";

// ============================================================================
// CONFIGURATION
// ============================================================================

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

// ============================================================================
// SUB-COMPONENT: DISTRIBUTION LIST
// Renders a vertical list of name + percentage (+ optional count).
// Accepts either pre-aggregated items [{name, count, percent}] or raw offers
// and will compute the distribution by a provided key.
// ============================================================================
function DistributionList({
  title,
  aggregatedItems, // optional: [{ name, count, percent }]
  rawOffers, // optional: array of offers to group
  groupBy = "title", // key to group raw offers by
  showCount = true,
}) {
  const items = useMemo(() => {
    if (aggregatedItems && Array.isArray(aggregatedItems)) {
      // Clone to avoid mutation and sort
      return [...aggregatedItems]
        .map((it) => ({ name: it.name, count: Number(it.count || 0), percent: Number(it.percent || 0) }))
        .sort((a, b) => b.percent - a.percent);
    }

    if (!rawOffers || !Array.isArray(rawOffers) || rawOffers.length === 0) {
      return [];
    }

    // Compute distribution by grouping key
    const map = new Map();
    for (const o of rawOffers) {
      const key = (o[groupBy] || o.jobTitle || o.title || o.role || "Unknown").toString();
      map.set(key, (map.get(key) || 0) + 1);
    }
    const total = rawOffers.length;
    const arr = Array.from(map.entries()).map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / total) * 100),
    }));
    arr.sort((a, b) => b.percent - a.percent);
    return arr;
  }, [aggregatedItems, rawOffers, groupBy]);

  if (!items || items.length === 0) {
    return (
      <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
        No results
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      {title && <h3 style={{ marginTop: 0, marginBottom: "12px", color: "#333" }}>{title}</h3>}
      <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((it) => (
          <li key={it.name} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
            <span style={{ color: "#0f172a", fontWeight: 600 }}>{it.name}</span>
            <span style={{ color: "#2563eb", fontWeight: 700 }}>{`${it.percent}%`}{showCount ? ` (${it.count})` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: PIE CHART (copied from SearchByJob implementation)
// ============================================================================
function InteractivePieChart({ data, onSelectSkill, selectedSkill, title, location, contextLabel }) {
  if (!data || data.length === 0) {
    return (
      <div style={{height: 250, display:'flex', alignItems:'center', justifyContent:'center', color:'#999'}}>
        No data
      </div>
    );
  }

  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const getTooltipText = (name, percent) => {
    const locText = location ? ` in ${location}` : "";
    const ctx = contextLabel ? ` ${contextLabel}` : "";
    return `${name} represents ${percent}%${ctx}${locText}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      {title && <h3 style={{ marginTop: 0, marginBottom: 12, color: '#333' }}>{title}</h3>}
      <svg viewBox="-1.4 -1.4 2.8 2.8" style={{ height: "250px", transform: "rotate(-90deg)", marginBottom: "18px" }}>
        {data.map((slice, index) => {
          const percentage = (slice.percent || 0) / 100;
          const startPercent = cumulativePercent;
          cumulativePercent += percentage;
          const endPercent = cumulativePercent;

          const [startX, startY] = getCoordinatesForPercent(startPercent);
          const [endX, endY] = getCoordinatesForPercent(endPercent);

          const isFullCircle = percentage >= 0.99;
          const largeArcFlag = percentage > 0.5 ? 1 : 0;

          const pathData = isFullCircle
            ? `M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0`
            : `M 0 0 L ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;

          const isSelected = selectedSkill === slice.name;
          const tooltipText = getTooltipText(slice.name, slice.percent);

          const midAngle = 2 * Math.PI * (startPercent + percentage / 2);
          const labelRadius = 0.75;
          const textX = labelRadius * Math.cos(midAngle);
          const textY = labelRadius * Math.sin(midAngle);
          const textRotation = `rotate(90, ${textX}, ${textY})`;
          const showLabel = (slice.percent || 0) > 6;

          return (
            <g key={slice.name}>
              <path
                d={pathData}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
                stroke={isSelected ? "#000" : "#fff"}
                strokeWidth={isSelected ? "0.03" : "0.01"}
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                onClick={() => onSelectSkill && onSelectSkill(slice.name)}
                opacity={isSelected ? 1 : 0.9}
              >
                <title>{tooltipText}</title>
              </path>
              {showLabel && (
                <text
                  x={textX}
                  y={textY}
                  transform={textRotation}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.10"
                  fill="#000"
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {slice.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div style={{ width: "100%", textAlign: "left" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {data.map((slice, index) => (
            <button
              key={slice.name}
              onClick={() => onSelectSkill && onSelectSkill(slice.name)}
              title={getTooltipText(slice.name, slice.percent)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 10px", borderRadius: 20, border: "1px solid #e5e7eb",
                background: selectedSkill === slice.name ? "#f3f4f6" : "#fff",
                cursor: "pointer", fontSize: "0.9rem", fontWeight: selectedSkill === slice.name ? "700" : "500"
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: 6, background: PIE_COLORS[index % PIE_COLORS.length] }}></span>
              {slice.name} <span style={{ color: "#6b7280", marginLeft: 6 }}>{slice.percent}%</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENT: BAR CHART (for non-exclusive skills)
// ============================================================================
function BarChart({ data, threshold = 2, title, onSelectSkill, selectedSkill }) {
  const items = (data || []).filter((d) => Number(d.percent || 0) > Number(threshold));

  if (!items || items.length === 0) {
    return (
      <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        No data
      </div>
    );
  }

  const maxPercent = Math.max(...items.map((i) => Number(i.percent || 0), 0), 1);

  return (
    <div style={{ width: '100%' }}>
      {title && <h3 style={{ marginTop: 0, marginBottom: 12, color: '#333' }}>{title}</h3>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it, idx) => (
          <div key={it.name} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                onClick={() => onSelectSkill && onSelectSkill(it.name)}
                style={{ border: 'none', background: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', fontWeight: selectedSkill === it.name ? 700 : 600 }}
              >
                {it.name}
              </button>
              <div style={{ color: '#64748b', fontSize: '13px' }}>{it.count} ({it.percent}%)</div>
            </div>

            <div style={{ width: '100%', height: 12, backgroundColor: '#f1f5f9', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${(Number(it.percent) / Number(maxPercent)) * 100}%`, height: '100%', backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SearchBySkills() {
  const navigate = useNavigate();
  
  // ========== STATE ==========
  
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
  const [allSkills, setAllSkills] = useState([]);
  
  // UI State
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldDetails, setFieldDetails] = useState(null);

  const [availableLocations, setAvailableLocations] = useState([]);
  const [skillSuggestions, setSkillSuggestions] = useState([]);
  const [selectedSkillDetail, setSelectedSkillDetail] = useState(null);

  // Resolve possible URL fields from API result objects
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

  // ========== FILTERED SUGGESTIONS ==========

  useEffect(() => {
    // Try session cache first
    const cachedLoc = sessionStorage.getItem("locations_cache");
    if (cachedLoc) {
      try {
        setAvailableLocations(JSON.parse(cachedLoc));
      } catch (e) {
        sessionStorage.removeItem("locations_cache");
      }
    }

    // Fetch and cache locations if not present
    if (!cachedLoc) {
      getLocations()
        .then((locs) => {
          const arr = locs || [];
          setAvailableLocations(arr);
          try { sessionStorage.setItem("locations_cache", JSON.stringify(arr)); } catch (e) {}
        })
        .catch((err) => console.error("Failed to load locations:", err));
    }
    // (site-wide stats removed from this page)
  }, []);

  useEffect(() => {
    if (!skillInput) {
      setSkillSuggestions([]);
      return;
    }

    const t = setTimeout(() => {
      // If we have a cached full skills list, filter client-side (avoid API per keystroke)
      if (allSkills && allSkills.length > 0) {
        const filtered = allSkills.filter((s) => s.toLowerCase().includes(skillInput.toLowerCase()));
        setSkillSuggestions(filtered.filter((s) => !selectedSkills.includes(s)).slice(0, 20));
        return;
      }

      // Fallback to server search
      getSkills({ q: skillInput, limit: 20 })
        .then((skills) => setSkillSuggestions((skills || []).filter((s) => !selectedSkills.includes(s))))
        .catch((err) => console.error("Failed to load skills:", err));
    }, 200);
    return () => clearTimeout(t);
  }, [skillInput, selectedSkills]);

  // Prefetch full skills list on mount and store in session cache for the session
  useEffect(() => {
    const cached = sessionStorage.getItem("skills_cache");
    if (cached) {
      try {
        setAllSkills(JSON.parse(cached));
      } catch (e) {
        sessionStorage.removeItem("skills_cache");
      }
    }

    if (!cached) {
      // attempt to fetch a large list once
      getSkills({ q: "", limit: 1000 })
        .then((skills) => {
          const arr = skills || [];
          setAllSkills(arr);
          try { sessionStorage.setItem("skills_cache", JSON.stringify(arr)); } catch (e) {}
        })
        .catch((err) => console.error("Failed to prefetch skills:", err));
    }
  }, []);

  const filteredSkillSuggestions = useMemo(
    () => (skillSuggestions || []).filter((s) => s.toLowerCase().includes(skillInput.toLowerCase())),
    [skillSuggestions, skillInput]
  );

  const filteredLocationSuggestions = useMemo(
    () => (availableLocations || []).filter((l) => l.toLowerCase().includes(locationInput.toLowerCase())),
    [availableLocations, locationInput]
  );

  // ========== HANDLERS ==========

  // Skill Handlers
  const handleAddSkill = (skill) => {
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setSkillInput("");
      setShowSkillSugg(false);
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skillToRemove));
  };

  // Location Handlers
  const handleSelectLocation = (loc) => {
    setLocationInput(loc);
    setShowLocationSugg(false);
  };

  // Search Handler
  const handleSearch = async () => {
    if (selectedSkills.length === 0) {
      alert("Please select at least one skill.");
      return;
    }
    // Clear previous results immediately (do not merge)
    setResults(null);
    setLoading(true);
    setHasSearched(true);
    setSelectedField(null);
    setFieldDetails(null);

    try {
      const resp = await reportJobsBySkills({
        skills: selectedSkills,
        location: locationInput || null,
        timeWindow: timeLimit,
      });

      setResults({
        jobFields: (resp?.job_titles || []).map((j) => ({ name: j.name, percent: j.percent, count: j.count })),
        topField: resp?.top_job_title || null,
        lastAnnouncements: resp?.last_announcements || [],
      });
    } catch (err) {
      console.error(err);
      setResults({ jobFields: [], topField: null, lastAnnouncements: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldClick = async (fieldName) => {
    setSelectedField(fieldName);
    setLoading(true);
    try {
      const details = await reportJobTitleDetails({
        jobTitle: fieldName,
        skills: selectedSkills,
        location: locationInput || null,
        timeWindow: timeLimit,
      });

      setFieldDetails({
        topSkills: details?.top_skills || [],
        topCompanies: details?.top_companies || [],
        lastAnnouncements: details?.last_announcements || [],
        totalJobs: details?.total_jobs || 0,
      });
    } catch (err) {
      console.error(err);
      setFieldDetails({ topSkills: [], topCompanies: [], lastAnnouncements: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToResults = () => {
    setSelectedField(null);
    setFieldDetails(null);
  };

  // ========== RENDER HELPERS ==========

  const renderSearchBar = () => (
    <div style={{ 
      backgroundColor: "#f8fafc", 
      padding: "20px", 
      borderRadius: "12px", 
      boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
      marginBottom: "30px",
      display: "flex",
      flexDirection: "column",
      gap: "20px"
    }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", alignItems: "flex-start" }}>
        
        {/* Skills Input Section */}
        <div style={{ flex: 2, minWidth: "300px", position: "relative" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#475569" }}>
            Your Skills
          </label>
          
          {/* Selected Skills Chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
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

          {/* Input Field */}
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
              width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "16px" 
            }}
          />
          
          {/* Suggestions Dropdown */}
          {showSkillSugg && skillInput && filteredSkillSuggestions.length > 0 && (
            <ul style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "6px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)", listStyle: "none", padding: 0, margin: "4px 0",
              maxHeight: "200px", overflowY: "auto"
            }}>
              {filteredSkillSuggestions.map(skill => (
                <li 
                  key={skill}
                  onClick={() => handleAddSkill(skill)}
                  style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                >
                  {skill}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Location Input Section */}
        <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#475569" }}>
            Location
          </label>
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
            style={{ 
              width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "16px" 
            }}
          />
          
          {/* Location Suggestions */}
          {showLocationSugg && locationInput && filteredLocationSuggestions.length > 0 && (
            <ul style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "6px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)", listStyle: "none", padding: 0, margin: "4px 0",
              maxHeight: "200px", overflowY: "auto"
            }}>
              {filteredLocationSuggestions.map(loc => (
                <li 
                  key={loc}
                  onClick={() => handleSelectLocation(loc)}
                  style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #f1f5f9" }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = "white"}
                >
                  {loc}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Time Limit */}
        <div style={{ flex: 1, minWidth: "150px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#475569" }}>
            Time Limit
          </label>
          <select
            value={timeLimit}
            onChange={(e) => setTimeLimit(e.target.value)}
            style={{ 
              width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "16px", backgroundColor: "white" 
            }}
          >
            {TIME_LIMITS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <div style={{ display: "flex", alignItems: "flex-end", height: "74px" }}>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: "10px 25px",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              height: "42px"
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
    </div>
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

  const renderDetailView = () => {
    const details = fieldDetails || { topSkills: [], topCompanies: [], lastAnnouncements: [] };

    // Use backend-provided percent (fraction of announcements of that job that contain the skill).
    // Do not normalize to sum=100 because skills are not mutually exclusive.
    const normalizedTopSkills = (details.topSkills || []).map((s) => ({
      name: s.name,
      count: Number(s.count || 0),
      percent: Number((s.percent ?? 0)),
    }));

    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 30 }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>
              Job field: <span style={{ color: '#2563eb' }}>{selectedField}</span>
            </h2>
            <div style={{ marginTop: 6, color: '#64748b', fontSize: 14 }}>
              {fieldDetails?.totalJobs ? (
                <strong style={{ fontSize: 18, color: '#0f172a' }}>{fieldDetails.totalJobs}</strong>
              ) : (
                <span>-</span>
              )} announcements for this field
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
          {/* LEFT SIDE: Top Skills List (count + percentage) */}
          <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, color: '#333' }}>Top Skills Required</h3>
            <div style={{ marginTop: '6px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(normalizedTopSkills || []).map((skill, idx) => (
                  <li key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 6, background: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                      <span style={{ color: '#0f172a', fontWeight: 600 }}>{skill.name}</span>
                    </div>
                    <div style={{ color: '#64748b' }}>{skill.count} announcements • {skill.percent}%</div>
                  </li>
                ))}
                {(!normalizedTopSkills || normalizedTopSkills.length === 0) && (
                  <li style={{ padding: '12px', color: '#94a3b8' }}>No skills data available.</li>
                )}
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: Top Companies & Announcements */}
          <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Top 3 Companies */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>Top 3 Companies</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {details.topCompanies.map((comp, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <span style={{ fontWeight: '600', color: '#334155' }}>{idx + 1}. {comp.name}</span>
                    <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{comp.count} jobs</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last 5 Announcements for this field */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flex: 1 }}>
              <h3 style={{ marginTop: 0, color: '#333' }}>Last 5 Announcements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {details.lastAnnouncements.map((job) => (
                  <a
                    key={job.id}
                    href={getJobUrl(job)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'block', padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', textDecoration: 'none', border: '1px solid #e2e8f0', transition: 'transform 0.1s' }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                  >
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{job.title}</div>
                    <div style={{ fontSize: '14px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span>{job.company}</span>
                      <span>{job.date}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px", fontFamily: "'Inter', sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "30px", color: "#0f172a" }}>
        Search by Skills Dashboard
      </h1>

      {/* Always show search bar unless in detail view */}
      {!selectedField && renderSearchBar()}

      {/* Content Area */}
      <div style={{ minHeight: "400px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>
            Loading analysis...
          </div>
        )}

        {!loading && !hasSearched && !selectedField && (
          <div style={{ textAlign: "center", padding: "50px", color: "#94a3b8", border: "2px dashed #e2e8f0", borderRadius: "12px" }}>
            Enter your skills and location above to start the analysis.
          </div>
        )}

        {!loading && hasSearched && !selectedField && renderResultsView()}

        {!loading && selectedField && renderDetailView()}
      </div>
    </div>
  );
}

export default SearchBySkills;
