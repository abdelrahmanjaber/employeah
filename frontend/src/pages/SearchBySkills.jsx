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

// Mock Data for Autocomplete
const AVAILABLE_SKILLS = [
  "Python", "JavaScript", "React", "Node.js", "SQL", "Docker", 
  "Kubernetes", "AWS", "Java", "C++", "Go", "Rust", "TypeScript",
  "Machine Learning", "Data Analysis", "Pandas", "Terraform"
];

const AVAILABLE_LOCATIONS = [
  "London", "Berlin", "Munich", "Remote", "New York", "San Francisco", 
  "Paris", "Amsterdam", "Zurich", "Milan"
];

// Mock data for the "Results" view (Job Fields distribution)
const MOCK_RESULTS_DATA = {
  jobFields: [
    { name: "Backend Developer", percent: 40, count: 120 },
    { name: "Data Scientist", percent: 25, count: 75 },
    { name: "Frontend Developer", percent: 20, count: 60 },
    { name: "DevOps Engineer", percent: 12, count: 36 },
    { name: "Product Manager", percent: 1.5, count: 4 }, // Should be filtered out (< 2%)
    { name: "QA Engineer", percent: 1.5, count: 4 }      // Should be filtered out (< 2%)
  ],
  topField: "Backend Developer",
  lastAnnouncements: [
    { id: 1, title: "Senior Python Developer", company: "TechCorp", date: "2023-10-25", url: "#" },
    { id: 2, title: "Data Analyst", company: "DataInc", date: "2023-10-24", url: "#" },
    { id: 3, title: "Full Stack Engineer", company: "WebSolutions", date: "2023-10-23", url: "#" },
    { id: 4, title: "DevOps Specialist", company: "CloudSys", date: "2023-10-22", url: "#" },
    { id: 5, title: "Junior Backend Dev", company: "StartupX", date: "2023-10-21", url: "#" }
  ]
};

// Mock data for the "Field Detail" view (Drill-down into a job field)
const MOCK_FIELD_DETAILS = {
  "Backend Developer": {
    topSkills: [
      { name: "Python", percent: 80, count: 96 },
      { name: "SQL", percent: 70, count: 84 },
      { name: "Docker", percent: 50, count: 60 },
      { name: "AWS", percent: 40, count: 48 },
      { name: "Django", percent: 30, count: 36 }
    ],
    topCompanies: [
      { name: "TechCorp", count: 15 },
      { name: "StartupX", count: 10 },
      { name: "EnterpriseSol", count: 8 }
    ],
    lastAnnouncements: [
      { id: 101, title: "Backend Lead", company: "TechCorp", date: "2023-10-26", url: "#" },
      { id: 102, title: "Python Dev", company: "StartupX", date: "2023-10-25", url: "#" },
      { id: 103, title: "Server Engineer", company: "EnterpriseSol", date: "2023-10-24", url: "#" },
      { id: 104, title: "API Developer", company: "TechCorp", date: "2023-10-23", url: "#" },
      { id: 105, title: "Backend Intern", company: "Innovate", date: "2023-10-22", url: "#" }
    ]
  },
  "default": {
    topSkills: [
      { name: "Skill A", percent: 60, count: 60 },
      { name: "Skill B", percent: 50, count: 50 },
      { name: "Skill C", percent: 40, count: 40 }
    ],
    topCompanies: [
      { name: "Company A", count: 12 },
      { name: "Company B", count: 9 },
      { name: "Company C", count: 7 }
    ],
    lastAnnouncements: [
      { id: 201, title: "Job A", company: "Company A", date: "2023-10-26", url: "#" },
      { id: 202, title: "Job B", company: "Company B", date: "2023-10-25", url: "#" },
      { id: 203, title: "Job C", company: "Company C", date: "2023-10-24", url: "#" },
      { id: 204, title: "Job D", company: "Company A", date: "2023-10-23", url: "#" },
      { id: 205, title: "Job E", company: "Company B", date: "2023-10-22", url: "#" }
    ]
  }
};

// ============================================================================
// SUB-COMPONENT: PIE CHART (Used in Detail View)
// ============================================================================
function InteractivePieChart({ data, onSelectSlice, selectedSliceName, title }) {
  if (!data || data.length === 0) {
    return (
      <div style={{height: 350, display:'flex', alignItems:'center', justifyContent:'center', color:'#999'}}>
        No data available
      </div>
    );
  }

  let cumulativePercent = 0;

  const getCoordinatesForPercent = (percent) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      <h3 style={{ marginBottom: "20px", color: "#333" }}>{title}</h3>
      <svg viewBox="-1.4 -1.4 2.8 2.8" style={{ height: "350px", transform: "rotate(-90deg)", marginBottom: "30px" }}>
        {data.map((slice, index) => {
          const percentage = slice.percent / 100;
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

          const isSelected = selectedSliceName === slice.name;
          
          // Label positioning
          const midAngle = 2 * Math.PI * (startPercent + percentage / 2);
          const labelRadius = 0.85; 
          const textX = labelRadius * Math.cos(midAngle);
          const textY = labelRadius * Math.sin(midAngle);
          const textRotation = `rotate(90, ${textX}, ${textY})`;
          const showLabel = slice.percent > 5;

          return (
            <g key={slice.name}>
              <path
                d={pathData}
                fill={PIE_COLORS[index % PIE_COLORS.length]}
                stroke={isSelected ? "#000" : "#fff"}
                strokeWidth={isSelected ? "0.03" : "0.01"}
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
                onClick={() => onSelectSlice && onSelectSlice(slice.name)}
                opacity={isSelected ? 1 : 0.85}
              >
                <title>{`${slice.name}: ${slice.percent}% (${slice.count} jobs)`}</title>
              </path>
              
              {showLabel && (
                <text
                  x={textX}
                  y={textY}
                  transform={textRotation}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="0.12" 
                  fill="#000"
                  fontWeight="600"
                  pointerEvents="none"
                  style={{ textShadow: "0px 0px 2px rgba(255,255,255,0.8)" }}
                >
                  {slice.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
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
  const [timeLimit, setTimeLimit] = useState("1m");
  
  // UI State
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedField, setSelectedField] = useState(null);

  // ========== FILTERED SUGGESTIONS ==========

  const filteredSkillSuggestions = AVAILABLE_SKILLS.filter(s => 
    s.toLowerCase().includes(skillInput.toLowerCase()) && 
    !selectedSkills.includes(s)
  );

  const filteredLocationSuggestions = AVAILABLE_LOCATIONS.filter(l => 
    l.toLowerCase().includes(locationInput.toLowerCase())
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
    
    setLoading(true);
    setHasSearched(true);
    setSelectedField(null);

    // Simulate API call
    setTimeout(() => {
      setResults(MOCK_RESULTS_DATA);
      setLoading(false);
    }, 800);
  };

  const handleFieldClick = (fieldName) => {
    setSelectedField(fieldName);
  };

  const handleBackToResults = () => {
    setSelectedField(null);
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
            placeholder="e.g. London"
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
                  href={job.url} 
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
    const details = MOCK_FIELD_DETAILS[selectedField] || MOCK_FIELD_DETAILS["default"];

    return (
      <div>
        <button 
          onClick={handleBackToResults}
          style={{ 
            marginBottom: "20px", 
            padding: "8px 16px", 
            backgroundColor: "#fff", 
            border: "1px solid #cbd5e1", 
            borderRadius: "6px", 
            cursor: "pointer",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "500",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8fafc"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#fff"}
        >
          ← Back to Results
        </button>

        <h2 style={{ marginBottom: "30px", color: "#1e293b" }}>
          Job field selected: <span style={{ color: "#2563eb" }}>{selectedField}</span>
        </h2>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "40px" }}>
          {/* LEFT SIDE: Top Skills Pie Chart */}
          <div style={{ flex: 1, minWidth: "300px", backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <InteractivePieChart 
              title="Top Skills Required"
              data={details.topSkills}
              onSelectSlice={() => {}} // No action on click for this chart
            />
            <div style={{ marginTop: "20px" }}>
              <h4 style={{ marginBottom: "10px", color: "#333" }}>Skill Breakdown</h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {details.topSkills.map((skill, idx) => (
                  <li key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                      {skill.name}
                    </span>
                    <span style={{ color: "#64748b" }}>{skill.count} jobs ({skill.percent}%)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: Top Companies & Announcements */}
          <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Top 3 Companies */}
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
              <h3 style={{ marginTop: 0, color: "#333" }}>Top 3 Companies</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {details.topCompanies.map((comp, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                    <span style={{ fontWeight: "600", color: "#334155" }}>{idx + 1}. {comp.name}</span>
                    <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "bold" }}>
                      {comp.count} jobs
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last 5 Announcements for this field */}
            <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", flex: 1 }}>
              <h3 style={{ marginTop: 0, color: "#333" }}>Last 5 Announcements</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {details.lastAnnouncements.map((job) => (
                  <a 
                    key={job.id} 
                    href={job.url} 
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

        {/* Bottom Back Button */}
        <div style={{ marginTop: "40px", display: "flex", justifyContent: "center" }}>
          <button 
            onClick={handleBackToResults}
            style={{ 
              padding: "10px 25px", 
              backgroundColor: "#f1f5f9", 
              border: "1px solid #cbd5e1", 
              borderRadius: "6px", 
              cursor: "pointer",
              color: "#475569",
              fontWeight: "600",
              fontSize: "15px"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#e2e8f0"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#f1f5f9"}
          >
            ← Back to Results
          </button>
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
