import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCoursesForSkill,
  getJobSkillDistribution,
  getJobTitles,
  getLocations,
  getSkillTrend,
} from "../lib/apiClient";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PIE_COLORS = [
  "#86efac", "#fde047", "#93c5fd", "#fca5a5", 
  "#d8b4fe", "#fdba74", "#cbd5e1", "#6ee7b7", 
  "#f9a8d4", "#c4b5fd", "#94a3b8", "#a7f3d0"
];

// ============================================================================
// SUB-COMPONENT: PIE CHART & LIST
// ============================================================================
function InteractivePieChart({ data, onSelectSkill, selectedSkill, jobTitle, location }) {
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

  const getTooltipText = (skillName, percent) => {
    const locText = location ? ` in ${location}` : "";
    return `${skillName} represents ${percent}% out of all skills required as a ${jobTitle}${locText}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
      
      {/* 1. SVG PIE CHART */}
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

          const isSelected = selectedSkill === slice.name;
          const tooltipText = getTooltipText(slice.name, slice.percent);

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
                onClick={() => onSelectSkill(slice.name)}
                opacity={isSelected ? 1 : 0.85}
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

      {/* 2. CLICKABLE SKILL LIST */}
      <div style={{ width: "100%", textAlign: "left" }}>
        <h3 style={{ fontSize: "1rem", marginBottom: "15px", color: "#374151" }}>Prevalent Skills (Sorted):</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {data.map((slice, index) => {
            const isSelected = selectedSkill === slice.name;
            const color = PIE_COLORS[index % PIE_COLORS.length];
            const tooltipText = getTooltipText(slice.name, slice.percent);
            
            return (
              <button
                key={slice.name}
                onClick={() => onSelectSkill(slice.name)}
                title={tooltipText} 
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "8px 12px",
                  border: isSelected ? "2px solid #000" : "1px solid #e5e7eb",
                  borderRadius: "20px",
                  background: isSelected ? "#f3f4f6" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: isSelected ? "bold" : "normal",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ display: "block", width: "12px", height: "12px", borderRadius: "50%", background: color }}></span>
                {slice.name} <span style={{ color: "#6b7280", fontSize: "0.85rem" }}>{slice.percent}%</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function SearchByJob() {
  const navigate = useNavigate();
  
  const [jobInput, setJobInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [skillsData, setSkillsData] = useState([]); 
  const [selectedSkill, setSelectedSkill] = useState(null);
  
  const [trendData, setTrendData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);

  const [showJobSugg, setShowJobSugg] = useState(false);
  const [showLocSugg, setShowLocSugg] = useState(false);

  const [availableJobs, setAvailableJobs] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getJobTitles(), getLocations()])
      .then(([jobs, locs]) => {
        if (cancelled) return;
        setAvailableJobs(jobs || []);
        setAvailableLocations(locs || []);
      })
      .catch((err) => console.error("Failed to load meta:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const availableJobsMemo = useMemo(() => availableJobs.slice().sort(), [availableJobs]);
  const availableLocationsMemo = useMemo(() => availableLocations.slice().sort(), [availableLocations]);

  const filteredJobSuggestions = availableJobsMemo.filter(j => 
    j.toLowerCase().includes(jobInput.toLowerCase()) && jobInput.length > 0
  );
  
  const filteredLocSuggestions = availableLocationsMemo.filter(l => 
    l.toLowerCase().includes(locationInput.toLowerCase()) && locationInput.length > 0
  );

  const handleSearch = async () => {
    if (!jobInput) return;
    setLoading(true);
    setSkillsData([]);
    setSelectedSkill(null);
    setTrendData([]);
    setCoursesData([]);
    setShowJobSugg(false);
    setShowLocSugg(false);

    try {
      const result = await getJobSkillDistribution({ jobTitle: jobInput, location: locationInput });
      
      if (result.success && result.skills) {
        const formattedSkills = Object.entries(result.skills)
          .map(([name, stats]) => ({ name, percent: stats.percentage }))
          .sort((a, b) => b.percent - a.percent);

        setSkillsData(formattedSkills);

        if (formattedSkills.length > 0) {
          handleSkillSelect(formattedSkills[0].name);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSkillSelect = async (skill) => {
    setSelectedSkill(skill);
    try {
      const [trend, courses] = await Promise.all([
        getSkillTrendData(skill, jobInput, locationInput), 
        getTUMCoursesBySkill(skill)
      ]);
      setTrendData(trend);
      setCoursesData(courses);
    } catch (err) {
      console.error(err);
    }
  };

  const formatTooltipDate = (dateStr) => {
    const [month, year] = dateStr.split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  // --- CHART SETUP ---
  const CHART_WIDTH = 500;
  const CHART_HEIGHT = 180;
  const MAX_VAL = 100;

  const getLinePath = () => {
    if (trendData.length < 2) return "";
    return trendData.map((point, i) => {
      const x = (i / (trendData.length - 1)) * CHART_WIDTH;
      const y = CHART_HEIGHT - (point.y / MAX_VAL) * CHART_HEIGHT;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(" ");
  };

  const suggestionListStyle = {
    position: "absolute", top: "100%", left: 0, right: 0,
    background: "#fff", border: "2px solid #000", borderTop: "none",
    listStyle: "none", padding: 0, margin: 0, zIndex: 10,
    maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px"
  };
  // --- NEW: CHART TIME SCALING LOGIC ---
  const parseDate = (dateStr) => {
    const [month, year] = dateStr.split('.');
    return new Date(parseInt(year), parseInt(month) - 1);
  };

  const formatAxisDate = (dateObj) => {
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${month}.${year}`;
  };

  // Calculate X position based on Time (Timestamp) instead of Index
  const getX = (dateStr, minTime, maxTime) => {
    const time = parseDate(dateStr).getTime();
    if (maxTime === minTime) return CHART_WIDTH / 2; // Center if only 1 point
    return ((time - minTime) / (maxTime - minTime)) * CHART_WIDTH;
  };

  // Generate exactly 5 evenly spaced dates for the labels
  const getAxisTicks = () => {
    if (!trendData.length) return [];
    
    const times = trendData.map(d => parseDate(d.x).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    if (minTime === maxTime) return [parseDate(trendData[0].x)];

    const ticks = [];
    const step = (maxTime - minTime) / 4; // 4 intervals = 5 ticks
    for (let i = 0; i <= 4; i++) {
      ticks.push(new Date(minTime + step * i));
    }
    return ticks;
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          cursor: "pointer", marginBottom: "1rem", background: "#ecfdf5", 
          border: "1px solid #059669", padding: "5px 15px", borderRadius: "4px", color: "#065f46"
        }}
      >
        ← Back
      </button>

      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        {/* ADDED ICON HERE */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
          <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#1f2937" }}>Find Skills for your Dream Job</h1>
        </div>
        <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "0.5rem" }}>
          Enter a job field and a location to get tailored insights.
        </p>
      </header>

      {/* SEARCH BAR */}
      <section style={{ display: "flex", gap: "15px", justifyContent: "center", alignItems: "end", marginBottom: "3rem" }}>
        
        {/* Job Field Input */}
        <div style={{ position: "relative", width: "300px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "1.2rem" }}>Job Field</label>
          <input 
            placeholder="Start typing a job field..." 
            value={jobInput}
            onChange={(e) => { setJobInput(e.target.value); setShowJobSugg(true); }}
            onFocus={() => { setShowJobSugg(true); setShowLocSugg(false); }}
            style={{ padding: "15px", width: "100%", border: "2px solid #000", fontSize: "1rem", borderRadius: "8px" }}
          />
          {showJobSugg && filteredJobSuggestions.length > 0 && (
            <ul style={suggestionListStyle}>
              {filteredJobSuggestions.map((j) => (
                <li key={j} 
                    onClick={() => { setJobInput(j); setShowJobSugg(false); }}
                    style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                    onMouseEnter={(e) => e.target.style.background = "#ecfdf5"}
                    onMouseLeave={(e) => e.target.style.background = "#fff"}>
                  {j}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Location Input */}
        <div style={{ position: "relative", width: "300px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "1.2rem" }}>Location <span style={{fontWeight:'normal', fontSize:'0.9rem', color:'#666'}}>(Optional)</span></label>
          <input 
            placeholder="City, Country, or Remote" 
            value={locationInput}
            onChange={(e) => { setLocationInput(e.target.value); setShowLocSugg(true); }}
            onFocus={() => { setShowLocSugg(true); setShowJobSugg(false); }}
            style={{ padding: "15px", width: "100%", border: "2px solid #000", fontSize: "1rem", borderRadius: "8px" }}
          />
          {showLocSugg && filteredLocSuggestions.length > 0 && (
            <ul style={suggestionListStyle}>
              {filteredLocSuggestions.map((l) => (
                <li key={l} 
                    onClick={() => { setLocationInput(l); setShowLocSugg(false); }}
                    style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                    onMouseEnter={(e) => e.target.style.background = "#ecfdf5"}
                    onMouseLeave={(e) => e.target.style.background = "#fff"}>
                  {l}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button 
          onClick={handleSearch}
          style={{ 
            padding: "15px 30px", background: "#6ee7b7", 
            color: "#000", border: "2px solid #000", 
            cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem", borderRadius: "8px",
            marginBottom: "1px"
          }}
        >
          {loading ? "Searching..." : "Find Required Skills"}
        </button>
      </section>

      {/* RESULTS GRID */}
      {skillsData.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px", border: "2px solid #e5e7eb", padding: "40px", borderRadius: "12px" }}>
          
          {/* LEFT: PIE CHART & LIST */}
          <section>
            <h2 style={{ textAlign: "center", marginBottom: "20px" }}>
              Required Skills for <span style={{ color: "#059669" }}>{jobInput}</span>
              {locationInput && <span style={{fontWeight: 'bold', color: '#000'}}> in {locationInput}</span>}
            </h2>
            <p style={{ textAlign: "center", marginBottom: "30px", fontSize: "0.9rem", color: "#666" }}>
              Distribution of skill requirements in job postings.
            </p>
            
            <InteractivePieChart 
              data={skillsData} 
              onSelectSkill={handleSkillSelect} 
              selectedSkill={selectedSkill}
              jobTitle={jobInput}
              location={locationInput}
            />
          </section>

          {/* RIGHT: TRENDS & COURSES */}
          <section style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            
            {/* Trend Chart */}
            <div style={{ opacity: selectedSkill ? 1 : 0.5, transition: "opacity 0.3s" }}>
              <div style={{ marginBottom: "25px", textAlign: "left" }}>
                <div style={{ background: "#d1fae5", padding: "5px 15px", borderRadius: "20px", display: "inline-block", fontWeight: "bold" }}>
                  Demand for {selectedSkill || "..."}
                  {locationInput ? ` in ${locationInput}` : ""}
                </div>
                {/* --- UPDATED TEXT LABEL HERE --- */}
                <div style={{ marginTop: "10px", fontSize: "0.9rem", color: "#555" }}>
                  % of <strong>{jobInput}</strong> jobs requiring <strong>{selectedSkill ? selectedSkill.toLowerCase() : "..."}</strong>
                  {locationInput && <span> in <strong>{locationInput}</strong></span>}
                </div>
              </div>
              
              <div style={{ height: "200px", borderLeft: "2px solid #000", borderBottom: "2px solid #000", position: "relative", marginLeft: "30px" }}>
                <span style={{ position: "absolute", left: "-30px", top: "-10px", fontSize: "0.8rem" }}>100</span>
                <span style={{ position: "absolute", left: "-25px", top: "45%", fontSize: "0.8rem" }}>50</span>
                <span style={{ position: "absolute", left: "-15px", bottom: "-5px", fontSize: "0.8rem" }}>0</span>

                {trendData.length > 0 ? (
                    <>
                        <svg width="100%" height="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ overflow: 'visible' }}>
                        <path d={(() => {
                            // Calculate Line Path using Time Scale
                            const times = trendData.map(d => parseDate(d.x).getTime());
                            const minTime = Math.min(...times);
                            const maxTime = Math.max(...times);
                            
                            return trendData.map((point, i) => {
                            const x = getX(point.x, minTime, maxTime);
                            const y = CHART_HEIGHT - (point.y / MAX_VAL) * CHART_HEIGHT;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                            }).join(" ");
                        })()} fill="none" stroke="#059669" strokeWidth="3" />

                        {/* Render Dots using Time Scale */}
                        {trendData.map((point, i) => {
                            const times = trendData.map(d => parseDate(d.x).getTime());
                            const minTime = Math.min(...times);
                            const maxTime = Math.max(...times);
                            const cx = getX(point.x, minTime, maxTime);
                            const cy = CHART_HEIGHT - (point.y / MAX_VAL) * CHART_HEIGHT;
                            const dateText = formatTooltipDate(point.x);
                            const locSuffix = locationInput ? ` in ${locationInput}` : "";
                            const tooltipText = `In ${dateText}, ${point.y}% of ${jobInput} jobs${locSuffix} required ${selectedSkill}`;

                            return (
                            <circle key={i} cx={cx} cy={cy} r={4} fill="#fff" stroke="#059669" strokeWidth="2">
                                <title>{tooltipText}</title>
                            </circle>
                            );
                        })}
                        </svg>

                        {/* NEW: Time-Scaled X-Axis Labels (Absolute Positioning) */}
                        <div style={{ position: "absolute", top: "210px", width: "100%", height: "20px" }}>
                        {getAxisTicks().map((date, i) => (
                            <span 
                            key={i} 
                            style={{ 
                                position: 'absolute', 
                                // Percentage left position ensures even spacing regardless of container width
                                left: `${(i / 4) * 100}%`, 
                                transform: 'translateX(-50%)',
                                fontSize: "0.8rem", 
                                fontWeight: "bold" 
                            }}
                            >
                            {formatAxisDate(date)}
                            </span>
                        ))}
                        </div>
                    </>
                    ) : (
                    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#999" }}>
                        Select a skill to see history
                    </div>
                    )}
              </div>
            </div>

            {/* TUM Courses Table */}
            <div style={{ opacity: selectedSkill ? 1 : 0.5, transition: "opacity 0.3s" }}>
              <div style={{ background: "#d1fae5", padding: "5px 15px", borderRadius: "20px", display: "inline-block", marginBottom: "10px" }}>
                <strong>Top TUM courses teaching {selectedSkill ? selectedSkill.toLowerCase() : "..."}</strong>
              </div>
              
              <div style={{ border: "2px solid #000", borderRadius: "8px", overflow: "hidden" }}>
                {coursesData.length > 0 ? coursesData.map((course, i) => (
                  <div key={i} style={{ 
                    padding: "12px", 
                    borderBottom: i === coursesData.length - 1 ? "none" : "1px solid #eee",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: "#fff"
                  }}>
                    <a href={course.url} target="_blank" rel="noopener noreferrer" 
                       style={{ color: "#000", textDecoration: "none", fontWeight: "500", fontSize: "0.95rem" }}
                       onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                       onMouseLeave={(e) => e.target.style.textDecoration = "none"}>
                      {course.title}
                    </a>
                    <span style={{ fontSize: "0.8rem", background: "#f3f4f6", padding: "2px 8px", borderRadius: "4px" }}>
                      {course.semester}
                    </span>
                  </div>
                )) : (
                  <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>
                    Select a skill to see relevant courses
                  </div>
                )}
              </div>
            </div>

          </section>
        </div>
      )}
    </main>
  );
}

export default SearchByJob;