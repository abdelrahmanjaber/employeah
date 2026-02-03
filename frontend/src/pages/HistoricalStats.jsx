import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCoursesForSkill,
  getFields,
  getLocations,
  getSkills,
  getSkillTopFields,
  getSkillTrend,
} from "../lib/apiClient";

/* THIS IS THE SKILL ANALYSIS PAGE
  --------------------------------
  Here, the user can enter a specific skill (like "Python") to see:
  1. A historical graph showing how demand for that skill has evolved over time.
  2. Which specific job fields (ex: "Software Engineer") require this skill.
  3. Which TUM courses they can take to learn or improve this skill.
*/


const THEME_COLOR = "#7e57c2"; 
const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const MAX_VAL = 100;

function HistoricalStats() {
  const navigate = useNavigate();
  // STATE MANAGEMENT 
  // Storing what the user types, whether we are loading, 
  // and the data we get back from the API (chart points, job fields, courses)
  const [skillInput, setSkillInput] = useState("");
  const [fieldInput, setFieldInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [jobFields, setJobFields] = useState([]);
  const [relevantCourses, setRelevantCourses] = useState([]);
  const [noDataReason, setNoDataReason] = useState(null);
  const [fieldLimit, setFieldLimit] = useState(10);

  const [showSkillSugg, setShowSkillSugg] = useState(false);
  const [showFieldSugg, setShowFieldSugg] = useState(false);
  const [showLocSugg, setShowLocSugg] = useState(false);
  const autoSearchTimer = useRef(null);


  const [availableFields, setAvailableFields] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [skillSuggestions, setSkillSuggestions] = useState([]);

  useEffect(() => {
    getFields().then((d) => setAvailableFields(d || [])).catch(() => {});
    getLocations().then((d) => setAvailableLocations(d || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!skillInput) {
      setSkillSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      getSkills({ q: skillInput, limit: 20 })
        .then((skills) => setSkillSuggestions(skills || []))
        .catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [skillInput]);

  const filteredSkillSuggestions = useMemo(
    () => (skillSuggestions || []).filter((s) => s.toLowerCase().includes(skillInput.toLowerCase()) && skillInput.length > 0),
    [skillSuggestions, skillInput]
  );
  const filteredFieldSuggestions = useMemo(
    () => (availableFields || []).filter((f) => f.toLowerCase().includes(fieldInput.toLowerCase()) && fieldInput.length > 0),
    [availableFields, fieldInput]
  );
  const filteredLocSuggestions = useMemo(
    () => (availableLocations || []).filter((l) => l.toLowerCase().includes(locationInput.toLowerCase()) && locationInput.length > 0),
    [availableLocations, locationInput]
  );
  // DATA FETCHING 
  // This function runs when we need to update the page. 
  // It calls our mock API to get the Trend Graph, Job Fields, and TUM Courses all at once.
  const triggerAnalysis = async (skillOverride = null, fieldOverride = null, locOverride = null) => {
    const finalSkill = skillOverride || skillInput;
    const finalField = fieldOverride !== null ? fieldOverride : fieldInput;
    const finalLoc = locOverride !== null ? locOverride : locationInput;
    
    if (!finalSkill) return;
    setLoading(true);
    setNoDataReason(null);
    setChartData([]);

    try {
      const apiLimit = fieldLimit === "All" ? 200 : Number(fieldLimit) || 50;
      const [trend, fields, courses] = await Promise.all([
        getSkillTrend({
          skill: finalSkill,
          field: finalField || null,
          location: finalLoc || null,
          timeWindow: "all",
          bucket: "month",
        }),
        getSkillTopFields({ skill: finalSkill, location: finalLoc || null, limit: apiLimit }),
        getCoursesForSkill(finalSkill, { limit: 5 })
      ]);
      
      const points = trend?.points || [];
      if (!points || points.length === 0) {
        setNoDataReason("general");
      } else {
        setChartData(points);
      }
      setJobFields((fields || []).map((f) => ({ field: f.field, percentage: f.percentage, count: f.count })));
      setRelevantCourses(courses || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleTableFieldClick = (clickedField) => {
    setFieldInput(clickedField);
    triggerAnalysis(null, clickedField, null);
  };

  // CHART MATH & HELPERS 
  // Parsing dates and calculating X/Y coordinates to draw the line chart manually.
  const parseDate = (dStr) => { 
    if (!dStr) return new Date();
    if (dStr.includes(".")) {
      const partsDot = dStr.split(".");
      if (partsDot.length === 2) {
        return new Date(parseInt(partsDot[1]), parseInt(partsDot[0]) - 1, 1);
      }
    }
    const parts = dStr.split('/');
    
    // If it's MM/YYYY (e.g., 01/2026)
    if (parts.length === 2) {
      return new Date(parseInt(parts[1]), parseInt(parts[0]) - 1, 1);
    }
    // If it's DD/MM/YYYY (e.g., 20/01/2026)
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    return new Date(dStr); // Fallback
  };

  const bounds = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 1 };
    const times = chartData.map(d => parseDate(d.x).getTime());
    return { min: Math.min(...times), max: Math.max(...times) };
  }, [chartData]);

  const getX = (dStr) => {
    const t = parseDate(dStr).getTime();
    const range = bounds.max - bounds.min;
    if (range === 0) return CHART_WIDTH / 2;
    return ((t - bounds.min) / range) * CHART_WIDTH;
  };

  const getAxisTicks = () => {
    if (chartData.length === 0) return [];
    const ticks = [];
    const step = (bounds.max - bounds.min) / 4;
    for (let i = 0; i <= 4; i++) ticks.push(new Date(bounds.min + step * i));
    return ticks;
  };

  const linePath = useMemo(() => {
    if (chartData.length < 2) return "";
    return chartData
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.x)} ${CHART_HEIGHT - (p.y / MAX_VAL) * CHART_HEIGHT}`)
      .join(" ");
  }, [chartData, bounds]);

  // calculating the little green/red badge that shows if demand went up or down
  const growthStat = useMemo(() => {
    if (!chartData || chartData.length < 2) return null;
    const oldest = chartData[0], newest = chartData[chartData.length - 1];
    const diff = Number((newest.y - oldest.y).toFixed(1));
    
    const start = parseDate(oldest.x), end = parseDate(newest.x);
    
    // Calculate total days difference
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let durationLabel = "";
    if (totalDays >= 365) {
      durationLabel = `${(totalDays / 365).toFixed(1).replace('.0', '')} years`;
    } else if (totalDays >= 30) {
      durationLabel = `${Math.round(totalDays / 30)} months`;
    } else if (totalDays > 0) {
      durationLabel = `${totalDays} days`;
    } else {
      durationLabel = "this period";
    }

    return {
      isUp: diff > 0, 
      isDown: diff < 0, 
      color: diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#475569",
      text: `${diff === 0 ? 'stable ' : (diff > 0 ? 'up ' : 'down ')}${Math.abs(diff)}% over the last ${durationLabel}`
    };
  }, [chartData]);

  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
  const displayedJobFields = useMemo(() => {
    if (fieldLimit === "All") return jobFields || [];
    const n = Number(fieldLimit) || 10;
    return (jobFields || []).slice(0, n);
  }, [jobFields, fieldLimit]);
  // Auto-refresh (debounced) whenever the user changes inputs
  useEffect(() => {
    if (!skillInput) {
      setChartData([]);
      setJobFields([]);
      setRelevantCourses([]);
      setNoDataReason(null);
      return;
    }
    if (autoSearchTimer.current) clearTimeout(autoSearchTimer.current);
    autoSearchTimer.current = setTimeout(() => {
      triggerAnalysis();
    }, 300);
    return () => {
      if (autoSearchTimer.current) clearTimeout(autoSearchTimer.current);
    };
  }, [skillInput, fieldInput, locationInput, fieldLimit]);
  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate(-1)} style={{ cursor: "pointer", marginBottom: "1rem", background: "#f3e5f5", border: "1px solid #000", padding: "5px 15px", borderRadius: "4px", color: "#4a148c" }}>← Back</button>

      <header style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
            <polyline points="17 6 23 6 23 12"></polyline>
          </svg>
          <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#1f2937" }}>Skill Analysis</h1>
        </div>
        <p style={{ fontSize: "1.1rem", color: "#4b5563", marginTop: "10px", fontWeight: "400" }}>
          Find the story behind your skill and how to grow it
        </p>
      </header>

      {/* SEARCH BAR */}
      <div style={{ display: "flex", gap: "15px", justifyContent: "center", alignItems: "end", marginBottom: "5rem" }}>
        <div style={{ position: "relative", width: "210px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Skill</label>
          <input placeholder="e.g. Python" value={skillInput} onChange={(e) => { setSkillInput(e.target.value); setShowSkillSugg(true); }} onFocus={() => setShowSkillSugg(true)} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px" }} />
          {showSkillSugg && filteredSkillSuggestions.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "2px solid #000", listStyle: "none", padding: 0, zIndex: 10, maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px" }}>
              {filteredSkillSuggestions.map(s => <li key={s} onClick={() => { setSkillInput(s); setShowSkillSugg(false); triggerAnalysis(s); }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }} onMouseEnter={(e) => e.target.style.background = "#f3e5f5"} onMouseLeave={(e) => e.target.style.background = "#fff"}>{s}</li>)}
            </ul>
          )}
        </div>
        <div style={{ position: "relative", width: "210px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Job Field</label>
          <input placeholder="Job Field" value={fieldInput} onChange={(e) => { setFieldInput(e.target.value); setShowFieldSugg(true); }} onFocus={() => setShowFieldSugg(true)} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px" }} />
          {showFieldSugg && filteredFieldSuggestions.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "2px solid #000", listStyle: "none", padding: 0, zIndex: 10, maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px" }}>
              {filteredFieldSuggestions.map(f => <li key={f} onClick={() => { setFieldInput(f); setShowFieldSugg(false); triggerAnalysis(null, f); }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }} onMouseEnter={(e) => e.target.style.background = "#f3e5f5"} onMouseLeave={(e) => e.target.style.background = "#fff"}>{f}</li>)}
            </ul>
          )}
        </div>
        <div style={{ position: "relative", width: "210px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Location</label>
          <input placeholder="Location" value={locationInput} onChange={(e) => { setLocationInput(e.target.value); setShowLocSugg(true); }} onFocus={() => setShowLocSugg(true)} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px" }} />
          {showLocSugg && filteredLocSuggestions.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "2px solid #000", listStyle: "none", padding: 0, zIndex: 10, maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px" }}>
              {filteredLocSuggestions.map(l => <li key={l} onClick={() => { setLocationInput(l); setShowLocSugg(false); triggerAnalysis(null, null, l); }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }} onMouseEnter={(e) => e.target.style.background = "#f3e5f5"} onMouseLeave={(e) => e.target.style.background = "#fff"}>{l}</li>)}
            </ul>
          )}
        </div>
      </div>

      {/* RESULTS GRID (Chart on left, Tables on right) */}
      {chartData && chartData.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "80px" }}>
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', width: '100%' }}>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", border: `2px solid ${THEME_COLOR}`, padding: "5px 15px", borderRadius: "20px", background: "#f8fafc" }}>
                Historical demand for <span style={{ color: THEME_COLOR }}>{capitalize(skillInput)}</span> {fieldInput && `in ${fieldInput}`} {locationInput && `in ${locationInput}`}
              </div>
              {growthStat && (
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: growthStat.color, backgroundColor: growthStat.isUp ? "#f0fdf4" : (growthStat.isDown ? "#fef2f2" : "#f1f5f9"), padding: "5px 12px", borderRadius: "12px", border: `1px solid ${growthStat.color}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {growthStat.isUp && <span>▲</span>} {growthStat.isDown && <span>▼</span>} {growthStat.text}
                </div>
              )}
            </div>

            <div style={{ height: `${CHART_HEIGHT}px`, borderLeft: "2px solid #000", borderBottom: "2px solid #000", position: "relative", marginLeft: "45px", marginTop: "20px" }}>
              {[100, 75, 50, 25, 0].map(val => (
                <span key={val} style={{ position: "absolute", left: "-45px", top: `${CHART_HEIGHT - (val / 100) * CHART_HEIGHT}px`, transform: "translateY(-50%)", fontSize: "0.75rem", fontWeight: "bold" }}>{val}%</span>
              ))}

              <svg width="100%" height="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ overflow: 'visible', display: 'block' }}>
                <path d={linePath} fill="none" stroke={THEME_COLOR} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {chartData.map((p, i) => {
                  const cx = getX(p.x);
                  const cy = CHART_HEIGHT - (p.y / MAX_VAL) * CHART_HEIGHT;
                  return (<circle key={i} cx={cx} cy={cy} r={6} fill="#fff" stroke={THEME_COLOR} strokeWidth="2" style={{ cursor: "pointer" }}><title>{`${p.y}% demand on ${p.x}`}</title></circle>);
                })}
              </svg>

              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, height: "20px", marginTop: "10px" }}>
                {getAxisTicks().map((date, i) => {
                   const label = `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                   return (
                     <span key={i} style={{ position: 'absolute', left: `${(i / 4) * 100}%`, transform: 'translateX(-50%)', fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
                       {label}
                     </span>
                   );
                })}
              </div>
            </div>
          </section>
          {/* RIGHT SIDE: Jobs and Courses Tables */}
          <section style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
            {/* Table 1: Which Job Fields need this skill */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 15 }}>
                <div style={{ fontSize: "1.1rem", fontWeight: "bold", border: `2px solid ${THEME_COLOR}`, padding: "5px 15px", borderRadius: "20px", display: "inline-block", background: "#f8fafc" }}>
                  Job Fields needing {capitalize(skillInput)} {locationInput && `in ${locationInput}`}
                </div>
                <select
                  value={fieldLimit}
                  onChange={(e) => setFieldLimit(e.target.value)}
                  style={{ padding: "8px 10px", borderRadius: "10px", border: `1px solid ${THEME_COLOR}`, background: "white", cursor: "pointer", fontWeight: 600 }}
                  title="Limit number of job fields"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value="All">All</option>
                </select>
              </div>
              <table style={{ width: "100%", border: `2px solid ${THEME_COLOR}`, borderCollapse: "collapse", borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
                <thead><tr style={{ background: "#f8fafc", borderBottom: `1px solid ${THEME_COLOR}` }}><th style={{ padding: "12px", textAlign: "left" }}>Job Field</th><th style={{ padding: "12px", textAlign: "right" }}>Demand</th></tr></thead>
                <tbody>
                  {displayedJobFields.map((field, i) => (
                    <tr key={i} onClick={() => handleTableFieldClick(field.field)} style={{ borderBottom: i === displayedJobFields.length - 1 ? "none" : "1px solid #eee", cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3e8ff"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: "12px" }}>{field.field}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{field.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Table 2: Recommended TUM Courses */}
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "15px", border: `2px solid ${THEME_COLOR}`, padding: "5px 15px", borderRadius: "20px", display: "inline-block", background: "#f8fafc" }}>Top TUM courses teaching {capitalize(skillInput)}</div>
              <div style={{ border: `2px solid ${THEME_COLOR}`, borderRadius: "8px", overflow: "hidden", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                {relevantCourses.length > 0 ? relevantCourses.map((c, i) => (
                  <div key={i} style={{ padding: "12px", borderBottom: i === relevantCourses.length - 1 ? "none" : "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontWeight: "500", textDecoration: "none", transition: "color 0.2s ease" }} onMouseEnter={(e) => { e.target.style.color = "#2563eb"; e.target.style.textDecoration = "underline"; }} onMouseLeave={(e) => { e.target.style.color = "#000"; e.target.style.textDecoration = "none"; }}>{c.title}</a>
                    <span style={{ fontSize: "0.8rem", background: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", fontWeight: "bold" }}>{c.semester}</span>
                  </div>
                )) : <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>No courses found</div>}
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

export default HistoricalStats;