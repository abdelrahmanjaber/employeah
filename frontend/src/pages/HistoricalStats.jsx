import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCoursesForSkill, getSkillTopJobTitles, getSkillTrend, getSkills, getJobTitles } from "../lib/apiClient";

// Predefined lists for autocomplete (loaded from backend)
const AVAILABLE_SKILLS = [];
const AVAILABLE_JOBS = [];

function HistoricalStats() {
  const navigate = useNavigate();
  
  // Form state
  const [skillInput, setSkillInput] = useState("");
  const [jobInput, setJobInput] = useState(""); 
  const [showSkillSugg, setShowSkillSugg] = useState(false);
  const [showJobSugg, setShowJobSugg] = useState(false);

  // UI & Results state
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [jobFields, setJobFields] = useState([]);
  const [relevantCourses, setRelevantCourses] = useState([]);
  const [availableJobs, setAvailableJobs] = useState(AVAILABLE_JOBS);
  const [skillSuggestions, setSkillSuggestions] = useState(AVAILABLE_SKILLS);

  useEffect(() => {
    getJobTitles()
      .then((jobs) => setAvailableJobs(jobs || []))
      .catch((err) => console.error("Failed to load job titles:", err));
  }, []);

  useEffect(() => {
    if (!skillInput) {
      setSkillSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      getSkills({ q: skillInput, limit: 20 })
        .then((skills) => setSkillSuggestions(skills || []))
        .catch((err) => console.error("Failed to load skills:", err));
    }, 200);
    return () => clearTimeout(t);
  }, [skillInput]);

  // Filtering logic
  const filteredSkillSuggestions = useMemo(
    () =>
      (skillSuggestions || []).filter(
        (s) => s.toLowerCase().includes(skillInput.toLowerCase()) && skillInput.length > 0
      ),
    [skillSuggestions, skillInput]
  );

  const filteredJobSuggestions = useMemo(
    () =>
      (availableJobs || []).filter(
        (j) => j.toLowerCase().includes(jobInput.toLowerCase()) && jobInput.length > 0
      ),
    [availableJobs, jobInput]
  );

  const triggerAnalysis = async (skillOverride, jobOverride) => {
    const finalSkill = skillOverride || skillInput;
    const finalJob = jobOverride !== undefined ? jobOverride : jobInput;
    
    if (!finalSkill) return;

    setLoading(true);
    setShowSkillSugg(false);
    setShowJobSugg(false);
    
    try {
      const [trend, fields, courses] = await Promise.all([
        getSkillTrend({ skill: finalSkill, jobTitle: finalJob || undefined }),
        getSkillTopJobTitles({ skill: finalSkill, limit: 5 }),
        getCoursesForSkill(finalSkill)
      ]);
      setChartData(trend?.points || []);
      setJobFields(fields || []);
      setRelevantCourses(courses);
    } catch (err) {
      console.error("Analysis Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSkill = (skill) => {
    setSkillInput(skill);
    setShowSkillSugg(false);
    triggerAnalysis(skill, jobInput);
  };

  const handleSelectJob = (job) => {
    setJobInput(job);
    setShowJobSugg(false);
    triggerAnalysis(skillInput, job);
  };

  // Helper to format date for tooltips
  const formatTooltipDate = (dateStr) => {
    const [month, year] = dateStr.split('.');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  };

  // --- NEW HELPER: Capitalize First Letter ---
  const capitalize = (str) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // --- CHART RENDERING LOGIC ---
  const CHART_WIDTH = 600;
  const CHART_HEIGHT = 200;
  const MAX_VAL = 100;

  const getLinePath = () => {
    if (chartData.length < 2) return "";
    return chartData.map((point, i) => {
      const x = (i / (chartData.length - 1)) * CHART_WIDTH;
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

  const sectionHeaderStyle = {
    fontSize: "1.4rem", 
    marginBottom: "25px",
    color: "#1f2937",
    fontWeight: "bold"
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: 'sans-serif' }}>
      
      {/* HEADER */}
      <button 
        onClick={() => navigate(-1)} 
        style={{ 
          cursor: "pointer", marginBottom: "1rem", background: "#f3e5f5", 
          border: "1px solid #000", padding: "5px 15px", borderRadius: "4px", color: "#4a148c"
        }}
      >
        ← Back
      </button>

      <header style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#1f2937" }}>Skill Analysis</h1>
        </div>
        <p style={{ color: "#666", fontSize: "1.1rem", marginTop: "0.5rem" }}>
          Discover the story behind your skill & how to grow it
        </p>
      </header>

      {/* SEARCH BAR */}
      <div style={{ display: "flex", gap: "20px", justifyContent: "center", alignItems: "end", marginBottom: "5rem" }}>
        
        {/* Skill Input */}
        <div style={{ position: "relative", width: "300px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "1.2rem" }}>Skill</label>
          <input 
            placeholder="Enter a skill (e.g. Py...)" 
            value={skillInput}
            onChange={(e) => { setSkillInput(e.target.value); setShowSkillSugg(true); }}
            onFocus={() => { setShowSkillSugg(true); setShowJobSugg(false); }}
            style={{ padding: "15px", width: "100%", border: "2px solid #000", fontSize: "1rem", borderRadius: "8px" }}
          />
          {showSkillSugg && filteredSkillSuggestions.length > 0 && (
            <ul style={suggestionListStyle}>
              {filteredSkillSuggestions.map((s) => (
                <li key={s} onClick={() => handleSelectSkill(s)} 
                    style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                    onMouseEnter={(e) => e.target.style.background = "#f3e5f5"}
                    onMouseLeave={(e) => e.target.style.background = "#fff"}>
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Job Input */}
        <div style={{ position: "relative", width: "300px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", fontSize: "1.2rem" }}>Job Field <span style={{fontWeight:'normal', fontSize:'0.9rem', color:'#666'}}>(Optional)</span></label>
          <input 
            placeholder="Job Field (Optional)" 
            value={jobInput}
            onChange={(e) => { setJobInput(e.target.value); setShowJobSugg(true); }}
            onFocus={() => { setShowJobSugg(true); setShowSkillSugg(false); }}
            style={{ padding: "15px", width: "100%", border: "2px solid #000", fontSize: "1rem", borderRadius: "8px" }}
          />
          {showJobSugg && filteredJobSuggestions.length > 0 && (
            <ul style={suggestionListStyle}>
              {filteredJobSuggestions.map((j) => (
                <li key={j} onClick={() => handleSelectJob(j)}
                    style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }}
                    onMouseEnter={(e) => e.target.style.background = "#f3e5f5"}
                    onMouseLeave={(e) => e.target.style.background = "#fff"}>
                  {j}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search Button */}
        <button 
          onClick={() => triggerAnalysis()} 
          style={{ 
            padding: "15px 30px", background: "#d1c4e9", color: "#000", 
            border: "2px solid #000", cursor: "pointer", fontWeight: "bold", fontSize: "1.1rem", borderRadius: "8px",
            marginBottom: "1px"
          }}
        >
          {loading ? "Analyzing..." : "Search"}
        </button>
      </div>

      {/* Increased Grid Gap for better spacing */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "80px" }}>
        
        {/* Left Column: Chart */}
        <section>
          {/* Header with Capitalized Skill */}
          <div style={{ ...sectionHeaderStyle, marginBottom: "80px" }}>
            Historical demand for {skillInput ? 
              <span style={{ color: "#7e57c2" }}>{capitalize(skillInput)}</span> : 
              "skill"
            }
            {jobInput ? ` as a ${jobInput.toLowerCase()}` : ""}
          </div>
          
          <div style={{ height: "250px", borderLeft: "2px solid #000", borderBottom: "2px solid #000", position: "relative", marginLeft: "40px" }}>
            
            {/* Horizontal Y-Axis Label */}
            <span style={{ 
              position: "absolute", 
              left: "-35px", 
              top: "-45px",  
              fontSize: "0.85rem",
              color: "#555",
              fontWeight: "600",
              whiteSpace: "nowrap"
            }}>
              % of {jobInput ? jobInput : 'all'} jobs requiring {skillInput ? capitalize(skillInput) : '...'}
            </span>

            {/* Y-Axis Ticks */}
            <span style={{ position: "absolute", left: "-30px", top: "-10px", fontSize: "0.8rem" }}>100</span>
            <span style={{ position: "absolute", left: "-30px", top: "45%", fontSize: "0.8rem" }}>50</span>
            <span style={{ position: "absolute", left: "-20px", bottom: "-5px", fontSize: "0.8rem" }}>0</span>

            {chartData.length > 0 ? (
              <svg width="100%" height="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ overflow: 'visible' }}>
                <line x1="0" y1="100" x2="600" y2="100" stroke="#ddd" strokeWidth="1" strokeDasharray="5,5" />
                <path d={getLinePath()} fill="none" stroke="#7e57c2" strokeWidth="3" />
                
                {chartData.map((point, i) => {
                  const cx = (i / (chartData.length - 1)) * CHART_WIDTH;
                  const cy = CHART_HEIGHT - (point.y / MAX_VAL) * CHART_HEIGHT;
                  
                  const dateText = formatTooltipDate(point.x);
                  const skillText = skillInput ? capitalize(skillInput) : "skill";
                  const jobText = jobInput ? `${jobInput.toLowerCase()} jobs` : "jobs";
                  const tooltipText = `In ${dateText} ${point.y}% of ${jobText} required ${skillText}`;

                  return (
                    <circle 
                      key={i} 
                      cx={cx} 
                      cy={cy} 
                      r={5} 
                      fill="#fff" 
                      stroke="#7e57c2" 
                      strokeWidth="2"
                      style={{ cursor: "pointer" }}
                    >
                      <title>{tooltipText}</title>
                    </circle>
                  );
                })}
              </svg>
            ) : <p style={{ textAlign: "center", paddingTop: "100px", color: "#888" }}>Search to see trends</p>}
            
            {/* X-Axis Labels */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px", fontSize: "0.8rem", fontWeight: "bold" }}>
              {chartData.length > 0 && chartData.map((d, i) => {
                if (i === 0 || i === chartData.length - 1 || i % Math.ceil(chartData.length / 4) === 0) {
                  return <span key={i}>{d.x}</span>;
                }
                return null;
              })}
            </div>
          </div>
        </section>

        {/* Right Column: Tables */}
        <section style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
          
          {/* Job Fields Table */}
          <div>
            <div style={sectionHeaderStyle}>
              Job Fields that require {skillInput ? 
                <span style={{ color: "#7e57c2" }}>{capitalize(skillInput)}</span> : 
                "it"
              } the most
            </div>
            <table style={{ width: "100%", border: "1px solid #000", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #000", textAlign: "left", background: "#fafafa" }}>
                  <th style={{ padding: "12px" }}>Job Field</th>
                  <th style={{ padding: "12px", textAlign: "right" }}>Demand</th>
                </tr>
              </thead>
              <tbody>
                {jobFields.length > 0 ? jobFields.map((field, i) => (
                  <tr 
                    key={i} 
                    onClick={() => handleSelectJob(field.job_title)} 
                    style={{ borderBottom: "1px solid #000", cursor: "pointer" }} 
                    onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"} 
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                  >
                    <td style={{ padding: "12px" }}>{field.job_title}</td>
                    <td 
                      style={{ padding: "12px", textAlign: "right", fontWeight: "600" }}
                      title={`${field.percentage}% of ${field.job_title} jobs require ${skillInput || 'this skill'}`}
                    >
                      {field.percentage}%
                    </td>
                  </tr>
                )) : <tr><td colSpan="2" style={{ padding: "12px", color: "#999", textAlign: "center" }}>No data yet</td></tr>}
              </tbody>
            </table>
          </div>
          
          {/* TUM Courses Table */}
          <div>
            <div style={sectionHeaderStyle}>
              Top TUM courses teaching {skillInput ? 
                <span style={{ color: "#7e57c2" }}>{capitalize(skillInput)}</span> : 
                "it"
              }
            </div>
            <table style={{ width: "100%", border: "1px solid #000", borderCollapse: "collapse" }}>
              <tbody>
                {relevantCourses.length > 0 ? relevantCourses.map((course, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #000" }}>
                    <td style={{ padding: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <a href={course.url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", textDecoration: "none", fontWeight: "500" }} 
                         onMouseEnter={(e) => e.target.style.textDecoration = "underline"}
                         onMouseLeave={(e) => e.target.style.textDecoration = "none"}>
                        {course.title}
                      </a>
                      <span style={{ fontSize: "0.8rem", background: "#eee", padding: "2px 6px", borderRadius: "4px", marginLeft: "10px", whiteSpace: "nowrap" }}>
                        {course.semester}
                      </span>
                    </td>
                  </tr>
                )) : <tr><td style={{ padding: "12px", color: "#999", textAlign: "center" }}>No relevant courses found</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

export default HistoricalStats;