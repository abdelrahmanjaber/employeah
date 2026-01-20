import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import mockApi from "../lib/mockApi";
import { JOBS_DEMO } from "../lib/mock_database";

const THEME_COLOR = "#7e57c2"; 
const TIME_LIMITS = [
  { value: "all", label: "All Data" },
  { value: "1w", label: "Last week" },
  { value: "2w", label: "Last 2 weeks" },
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" }
];

const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const MAX_VAL = 100;

function HistoricalStats() {
  const navigate = useNavigate();
  const [skillInput, setSkillInput] = useState("");
  const [jobInput, setJobInput] = useState(""); 
  const [locationInput, setLocationInput] = useState("");
  const [timeLimit, setTimeLimit] = useState("all");
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [jobFields, setJobFields] = useState([]);
  const [relevantCourses, setRelevantCourses] = useState([]);
  const [noDataReason, setNoDataReason] = useState(null);

  const [showSkillSugg, setShowSkillSugg] = useState(false);
  const [showJobSugg, setShowJobSugg] = useState(false);
  const [showLocSugg, setShowLocSugg] = useState(false);

  const availableJobs = useMemo(() => [...new Set(JOBS_DEMO.map(j => j.title))].sort(), []);
  const availableLocations = useMemo(() => [...new Set(JOBS_DEMO.map(j => j.location))].sort(), []);
  const availableSkills = useMemo(() => [...new Set(JOBS_DEMO.flatMap(j => j.skills))].sort(), []);

  const filteredSkillSuggestions = availableSkills.filter(s => s.toLowerCase().includes(skillInput.toLowerCase()) && skillInput.length > 0);
  const filteredJobSuggestions = availableJobs.filter(j => j.toLowerCase().includes(jobInput.toLowerCase()) && jobInput.length > 0);
  const filteredLocSuggestions = availableLocations.filter(l => l.toLowerCase().includes(locationInput.toLowerCase()) && locationInput.length > 0);

  const triggerAnalysis = async (skillOverride = null, jobOverride = null, locOverride = null) => {
    const finalSkill = skillOverride || skillInput;
    const finalJob = jobOverride !== null ? jobOverride : jobInput;
    const finalLoc = locOverride !== null ? locOverride : locationInput;
    
    if (!finalSkill) return;
    setLoading(true);
    setNoDataReason(null);
    setChartData([]);

    try {
      const [trend, fields, courses] = await Promise.all([
        mockApi.getSkillTrendData(finalSkill, finalJob, finalLoc, timeLimit),
        mockApi.getJobFieldsBySkill(finalSkill, finalLoc, timeLimit),
        mockApi.getTUMCoursesBySkill(finalSkill)
      ]);
      
      if (!trend || trend.length === 0) {
        const fallback = await mockApi.getSkillTrendData(finalSkill, finalJob, finalLoc, "all");
        setNoDataReason(fallback && fallback.length > 0 ? 'period' : 'general');
      } else {
        setChartData(trend);
      }
      setJobFields(fields.map(f => ({ ...f, job_title: f.title })) || []);
      setRelevantCourses(courses || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleTableJobClick = (clickedJobTitle) => {
    setJobInput(clickedJobTitle);
    triggerAnalysis(null, clickedJobTitle, null);
  };

  // --- ROBUST DATE LOGIC ---
  const parseDate = (dStr) => { 
    if (!dStr) return new Date();
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
  useEffect(() => {
  if (skillInput) triggerAnalysis();
  }, [timeLimit, skillInput, jobInput, locationInput]); // Updates on ANY change
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
        
        {/* ADD THIS NEW LINE BELOW */}
        {/* The new tagline without italics */}
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
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Job Field <small style={{fontWeight:400}}>(Opt)</small></label>
          <input placeholder="Job Field" value={jobInput} onChange={(e) => { setJobInput(e.target.value); setShowJobSugg(true); }} onFocus={() => setShowJobSugg(true)} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px" }} />
          {showJobSugg && filteredJobSuggestions.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "2px solid #000", listStyle: "none", padding: 0, zIndex: 10, maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px" }}>
              {filteredJobSuggestions.map(j => <li key={j} onClick={() => { setJobInput(j); setShowJobSugg(false); triggerAnalysis(null, j); }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }} onMouseEnter={(e) => e.target.style.background = "#f3e5f5"} onMouseLeave={(e) => e.target.style.background = "#fff"}>{j}</li>)}
            </ul>
          )}
        </div>
        <div style={{ position: "relative", width: "210px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Location <small style={{fontWeight:400}}>(Opt)</small></label>
          <input placeholder="Location" value={locationInput} onChange={(e) => { setLocationInput(e.target.value); setShowLocSugg(true); }} onFocus={() => setShowLocSugg(true)} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px" }} />
          {showLocSugg && filteredLocSuggestions.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "2px solid #000", listStyle: "none", padding: 0, zIndex: 10, maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px" }}>
              {filteredLocSuggestions.map(l => <li key={l} onClick={() => { setLocationInput(l); setShowLocSugg(false); triggerAnalysis(null, null, l); }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }} onMouseEnter={(e) => e.target.style.background = "#f3e5f5"} onMouseLeave={(e) => e.target.style.background = "#fff"}>{l}</li>)}
            </ul>
          )}
        </div>
        <div style={{ position: "relative", width: "160px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Time Limit</label>
          <select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px", background: "white", cursor: 'pointer' }}>
            {TIME_LIMITS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <button onClick={() => triggerAnalysis()} style={{ padding: "15px 25px", background: "#d1c4e9", border: "2px solid #000", fontWeight: "bold", borderRadius: "8px", cursor: 'pointer' }}>{loading ? "..." : "Search"}</button>
      </div>

      {/* RESULTS GRID */}
      {chartData && chartData.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "80px" }}>
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px', width: '100%' }}>
              <div style={{ fontSize: "1.3rem", fontWeight: "bold", border: `2px solid ${THEME_COLOR}`, padding: "5px 15px", borderRadius: "20px", background: "#f8fafc" }}>
                Historical demand for <span style={{ color: THEME_COLOR }}>{capitalize(skillInput)}</span> {jobInput && `as a ${jobInput}`} {locationInput && `in ${locationInput}`} {timeLimit !== 'all' && `over the ${TIME_LIMITS.find(t => t.value === timeLimit)?.label.toLowerCase()}`}
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
                   const label = (timeLimit === '1w' || timeLimit === '2w')
                     ? `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
                     : `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
                   return (
                     <span key={i} style={{ position: 'absolute', left: `${(i / 4) * 100}%`, transform: 'translateX(-50%)', fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>
                       {label}
                     </span>
                   );
                })}
              </div>
            </div>
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: "60px" }}>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "15px", border: `2px solid ${THEME_COLOR}`, padding: "5px 15px", borderRadius: "20px", display: "inline-block", background: "#f8fafc" }}>
                Job Fields needing {capitalize(skillInput)} {locationInput && `in ${locationInput}`} {timeLimit !== 'all' && `over the last ${TIME_LIMITS.find(t => t.value === timeLimit)?.label.toLowerCase()}`}
              </div>
              <table style={{ width: "100%", border: `2px solid ${THEME_COLOR}`, borderCollapse: "collapse", borderRadius: "8px", overflow: "hidden", background: "#fff" }}>
                <thead><tr style={{ background: "#f8fafc", borderBottom: `1px solid ${THEME_COLOR}` }}><th style={{ padding: "12px", textAlign: "left" }}>Job Field</th><th style={{ padding: "12px", textAlign: "right" }}>Demand</th></tr></thead>
                <tbody>
                  {jobFields.map((field, i) => (
                    <tr key={i} onClick={() => handleTableJobClick(field.job_title)} style={{ borderBottom: i === jobFields.length - 1 ? "none" : "1px solid #eee", cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f3e8ff"} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                      <td style={{ padding: "12px" }}>{field.job_title}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: "bold" }}>{field.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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