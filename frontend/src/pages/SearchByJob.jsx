import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import mockApi from "../lib/mockApi";
import { JOBS_DEMO } from "../lib/mock_database";

// ============================================================================
// CONFIGURATION
// ============================================================================
const PIE_COLORS = [
  "#86efac", "#fde047", "#93c5fd", "#fca5a5", 
  "#d8b4fe", "#fdba74", "#cbd5e1", "#6ee7b7", 
  "#f9a8d4", "#c4b5fd", "#94a3b8", "#a7f3d0"
];

const TIME_LIMITS = [
  { value: "all", label: "All Data" },
  { value: "1w", label: "Last week" },
  { value: "2w", label: "Last 2 weeks" },
  { value: "1m", label: "Last month" },
  { value: "3m", label: "Last 3 months" }
];

const CHART_WIDTH = 500;
const CHART_HEIGHT = 180;
const MAX_VAL = 100;

// ============================================================================
// SUB-COMPONENT: SKILL BAR CHART
// ============================================================================
function SkillBarChart({ data, onSelectSkill, selectedSkill, limit, onLimitChange, maxPercent, jobTitle, location, timeLimit }) {
  const [trends, setTrends] = useState({});

  useEffect(() => {
    if (!data || data.length === 0) return;
    
    const fetchAllTrends = async () => {
      const trendResults = {};
      try {
        await Promise.all(data.map(async (skill) => {
          const history = await mockApi.getSkillTrendData(skill.name, jobTitle, location, timeLimit);
          if (history && history.length >= 2) {
            const first = history[0].y;
            const last = history[history.length - 1].y;
            trendResults[skill.name] = last - first;
          }
        }));
        setTrends(trendResults);
      } catch (err) {
        console.error("Trend fetch error:", err);
      }
    };

    fetchAllTrends();
  }, [data, jobTitle, location, timeLimit]);

  if (!data || data.length === 0) return null;

  return (
    <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>Required Skills</h3>
        <select value={limit} onChange={(e) => onLimitChange(e.target.value)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", cursor: 'pointer' }}>
          <option value={5}>Top 5</option>
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value="All">All</option>
        </select>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {data.map((skill, idx) => {
          const isSelected = selectedSkill === skill.name;
          const barColor = PIE_COLORS[idx % PIE_COLORS.length];
          const trendDiff = trends[skill.name] || 0;

          return (
            <div key={skill.name} style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => onSelectSkill(skill.name)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontWeight: isSelected ? '800' : '600', color: isSelected ? barColor : 'inherit' }}>
                    {skill.name} {isSelected && "•"}
                  </button>
                  {trendDiff > 0 && <span style={{ color: '#16a34a', fontSize: '10px' }}>▲</span>}
                  {trendDiff < 0 && <span style={{ color: '#dc2626', fontSize: '10px' }}>▼</span>}
                </div>
                <span style={{ fontSize: "12px", color: "#64748b" }}>{skill.count} jobs ({skill.percent}%)</span>
              </div>
              <div onClick={() => onSelectSkill(skill.name)} style={{ width: "100%", backgroundColor: "#f1f5f9", borderRadius: "6px", height: "20px", cursor: "pointer", overflow: "hidden" }}>
                <div style={{ width: `${(skill.percent / (maxPercent || 1)) * 100}%`, height: "100%", backgroundColor: barColor, transition: "width 0.5s ease", opacity: isSelected ? 1 : 0.7 }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================
function SearchByJob() {
  const navigate = useNavigate();
  const [limit, setLimit] = useState(10);
  const [jobInput, setJobInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [timeLimit, setTimeLimit] = useState("all");
  const [loading, setLoading] = useState(false);
  const [skillsData, setSkillsData] = useState([]); 
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [coursesData, setCoursesData] = useState([]);
  const [showJobSugg, setShowJobSugg] = useState(false);
  const [showLocSugg, setShowLocSugg] = useState(false);
  const [noDataReason, setNoDataReason] = useState(null);

  const availableJobs = useMemo(() => [...new Set(JOBS_DEMO.map(j => j.title))].sort(), []);
  const availableLocations = useMemo(() => [...new Set(JOBS_DEMO.map(j => j.location))].sort(), []);

  const filteredJobSuggestions = availableJobs.filter(j => j.toLowerCase().includes(jobInput.toLowerCase()) && jobInput.length > 0);
  const filteredLocSuggestions = availableLocations.filter(l => l.toLowerCase().includes(locationInput.toLowerCase()) && locationInput.length > 0);

  const handleSearch = async () => {
    if (!jobInput) return;
    setLoading(true);
    setSkillsData([]);
    setSelectedSkill(null);
    setTrendData([]);
    setNoDataReason(null);
    try {
      const result = await mockApi.searchByJob({ job: jobInput, location: locationInput, timeLimit });
      if (result && result.skills && Object.keys(result.skills).length > 0) {
        const formatted = Object.entries(result.skills)
          .map(([name, data]) => ({ name, percent: data.percentage, count: data.count }))
          .sort((a, b) => b.percent - a.percent);
        setSkillsData(formatted);
        if (formatted.length > 0) handleSkillSelect(formatted[0].name);
      } else {
        const fallbackResult = await mockApi.searchByJob({ job: jobInput, location: locationInput, timeLimit: 'all' });
        setNoDataReason(fallbackResult && fallbackResult.total_jobs > 0 ? 'period' : 'general');
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSkillSelect = async (skill) => {
    setSelectedSkill(skill);
    try {
      const [trend, courses] = await Promise.all([
        mockApi.getSkillTrendData(skill, jobInput, locationInput, timeLimit), 
        mockApi.getTUMCoursesBySkill(skill)
      ]);
      setTrendData(trend || []);
      setCoursesData(courses || []);
    } catch (err) { console.error(err); }
  };

  const displayedSkills = useMemo(() => limit === "All" ? skillsData : skillsData.slice(0, Number(limit)), [skillsData, limit]);
  const maxPercent = useMemo(() => skillsData.length === 0 ? 1 : Math.max(...skillsData.map(s => s.percent)), [skillsData]);

  const currentSkillColor = useMemo(() => {
    const idx = skillsData.findIndex(s => s.name === selectedSkill);
    return idx !== -1 ? PIE_COLORS[idx % PIE_COLORS.length] : "#059669";
  }, [selectedSkill, skillsData]);

  const parseDate = (dStr) => { 
    if (!dStr) return new Date();
    const parts = dStr.split('/');
    
    // Logic: Always treat as DD/MM/YYYY
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    // Fallback for MM/YYYY
    if (parts.length === 2) {
      return new Date(parseInt(parts[1]), parseInt(parts[0]) - 1, 1);
    }
    return new Date(dStr); 
  };

  const growthStat = useMemo(() => {
    if (!trendData || trendData.length < 2) return null;
    const oldest = trendData[0], newest = trendData[trendData.length - 1];
    const diff = Number((newest.y - oldest.y).toFixed(1));
    const start = parseDate(oldest.x), end = parseDate(newest.x);
    
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let durationLabel = "";
    if (totalDays >= 365) durationLabel = `${(totalDays / 365).toFixed(1).replace('.0', '')} years`;
    else if (totalDays >= 30) durationLabel = `${Math.round(totalDays / 30)} months`;
    else if (totalDays > 0) durationLabel = `${totalDays} days`;
    else durationLabel = "this period";

    return {
      isUp: diff > 0, isDown: diff < 0, isStable: diff === 0,
      color: diff > 0 ? "#16a34a" : diff < 0 ? "#dc2626" : "#475569",
      text: `${diff === 0 ? 'stable ' : (diff > 0 ? 'up ' : 'down ')}${Math.abs(diff)}% over the last ${durationLabel}`
    };
  }, [trendData]);

  const getX = (dStr, min, max) => {
    const t = parseDate(dStr).getTime();
    return max === min ? CHART_WIDTH / 2 : ((t - min) / (max - min)) * CHART_WIDTH;
  };

  const getAxisTicks = () => {
    if (!trendData || trendData.length === 0) return [];
    const times = trendData.map(d => parseDate(d.x).getTime());
    const minTime = Math.min(...times), maxTime = Math.max(...times);
    if (minTime === maxTime) return [parseDate(trendData[0].x)];
    const ticks = [];
    for (let i = 0; i <= 4; i++) ticks.push(new Date(minTime + ((maxTime - minTime) / 4) * i));
    return ticks;
  };

  const getLinePath = () => {
    if (!trendData || trendData.length < 2) return "";
    const times = trendData.map(d => parseDate(d.x).getTime());
    const min = Math.min(...times), max = Math.max(...times);
    return trendData.map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(p.x, min, max)} ${CHART_HEIGHT - (p.y / MAX_VAL) * CHART_HEIGHT}`).join(" ");
  };

  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto", fontFamily: 'sans-serif' }}>
      <button onClick={() => navigate(-1)} style={{ cursor: "pointer", marginBottom: "1rem", background: "#ecfdf5", border: "1px solid #059669", padding: "5px 15px", borderRadius: "4px", color: "#065f46" }}>← Back</button>

      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
          <h1 style={{ fontSize: "2.5rem", margin: 0, color: "#1f2937" }}>Find Skills for your Dream Job</h1>
        </div>
        
        <p style={{ fontSize: "1.1rem", color: "#4b5563", marginTop: "10px", fontWeight: "400" }}>
          Enter your dream job and we will show you the skills you need to get there
        </p>
      </header>

      <section style={{ display: "flex", gap: "15px", justifyContent: "center", alignItems: "end", marginBottom: "3rem" }}>
        <div style={{ position: "relative", width: "230px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Job Field</label>
          <input placeholder="Job field..." value={jobInput} onChange={(e) => { setJobInput(e.target.value); setShowJobSugg(true); }} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px" }} />
          {showJobSugg && filteredJobSuggestions.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "2px solid #000", listStyle: "none", padding: 0, zIndex: 10, maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px" }}>
              {filteredJobSuggestions.map(j => <li key={j} onClick={() => { setJobInput(j); setShowJobSugg(false); }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }}>{j}</li>)}
            </ul>
          )}
        </div>
        <div style={{ position: "relative", width: "230px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Location</label>
          <input placeholder="Location..." value={locationInput} onChange={(e) => { setLocationInput(e.target.value); setShowLocSugg(true); }} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px" }} />
          {showLocSugg && filteredLocSuggestions.length > 0 && (
            <ul style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "#fff", border: "2px solid #000", listStyle: "none", padding: 0, zIndex: 10, maxHeight: "200px", overflowY: "auto", borderRadius: "0 0 8px 8px" }}>
              {filteredLocSuggestions.map(l => <li key={l} onClick={() => { setLocationInput(l); setShowLocSugg(false); }} style={{ padding: "12px", cursor: "pointer", borderBottom: "1px solid #eee" }}>{l}</li>)}
            </ul>
          )}
        </div>
        <div style={{ position: "relative", width: "180px" }}>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Time Limit</label>
          <select value={timeLimit} onChange={(e) => setTimeLimit(e.target.value)} style={{ padding: "15px", width: "100%", border: "2px solid #000", borderRadius: "8px", background: "white", cursor: 'pointer' }}>
            {TIME_LIMITS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <button onClick={handleSearch} style={{ padding: "15px 30px", background: "#6ee7b7", border: "2px solid #000", fontWeight: "bold", borderRadius: "8px", cursor: 'pointer' }}>Search</button>
      </section>

      {!loading && noDataReason && (
        <div style={{ padding: "32px", textAlign: "center", backgroundColor: "#f0f9ff", borderRadius: "16px", border: "1px solid #bae6fd", color: "#0369a1", maxWidth: "700px", margin: "40px auto", boxShadow: "0 4px 12px rgba(186, 230, 253, 0.25)" }}>
          <div style={{ marginBottom: "16px" }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
          {noDataReason === 'period' ? (
            <div><h3 style={{ margin: "0 0 8px 0", fontSize: "1.25rem" }}>No results for this timeframe</h3><p style={{ margin: 0, opacity: 0.9 }}>It looks like there aren't any postings for <strong>{jobInput}</strong> in the selected period. Try expanding to <strong>Last 3 months</strong> or <strong>All Data</strong>.</p></div>
          ) : (
            <div><h3 style={{ margin: "0 0 8px 0", fontSize: "1.25rem" }}>Location not found</h3><p style={{ margin: 0, opacity: 0.9 }}>We couldn't find data for <strong>{jobInput}</strong> in <strong>{locationInput || 'this area'}</strong>. Try clearing the location or searching for a larger city.</p></div>
          )}
        </div>
      )}

      {!loading && skillsData && skillsData.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "50px", border: "2px solid #e5e7eb", padding: "40px", borderRadius: "12px" }}>
          <section>
            <h2 style={{ textAlign: "center", marginBottom: "10px" }}>Skill Breakdown for <span style={{ color: "#059669" }}>{jobInput}</span> {locationInput && `in ${locationInput}`}</h2>
            <SkillBarChart data={displayedSkills} onSelectSkill={handleSkillSelect} selectedSkill={selectedSkill} limit={limit} onLimitChange={setLimit} maxPercent={maxPercent} jobTitle={jobInput} location={locationInput} timeLimit={timeLimit} />
          </section>

          <section style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
            <div style={{ opacity: selectedSkill ? 1 : 0.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px', width: '100%' }}>
                <div style={{ background: "#f8fafc", padding: "5px 15px", borderRadius: "20px", fontWeight: "bold", border: `2px solid ${currentSkillColor}` }}>
                  Demand for {selectedSkill} as a {jobInput} {locationInput && `in ${locationInput}`}
                </div>
                {growthStat && (
                  <div style={{ fontSize: "0.85rem", fontWeight: "700", color: growthStat.color, backgroundColor: growthStat.isUp ? "#f0fdf4" : (growthStat.isDown ? "#fef2f2" : "#f1f5f9"), padding: "5px 12px", borderRadius: "12px", border: `1px solid ${growthStat.color}`, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {growthStat.isUp && <span>▲</span>} {growthStat.isDown && <span>▼</span>} {growthStat.text}
                  </div>
                )}
              </div>

              <div style={{ height: "200px", borderLeft: "2px solid #000", borderBottom: "2px solid #000", position: "relative", marginLeft: "45px", marginBottom: "40px" }}>
                {[100, 75, 50, 25, 0].map(val => (<span key={val} style={{ position: "absolute", left: "-45px", top: `${100 - val}%`, transform: "translateY(-50%)", fontSize: "0.75rem", fontWeight: "bold" }}>{val}%</span>))}
                {trendData && trendData.length > 0 ? (
                  <>
                    <svg width="100%" height="100%" viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} style={{ overflow: 'visible' }}>
                      <path d={getLinePath()} fill="none" stroke={currentSkillColor} strokeWidth="3" />
                      {trendData.map((p, i) => {
                        const times = trendData.map(d => parseDate(d.x).getTime());
                        const cx = getX(p.x, Math.min(...times), Math.max(...times));
                        const cy = CHART_HEIGHT - (p.y / MAX_VAL) * CHART_HEIGHT;

                        // --- REPLACE YOUR dateText LOGIC WITH THIS ---
                        const date = parseDate(p.x);
                        const isDaily = timeLimit === '1w' || timeLimit === '2w';
                        const dateText = isDaily 
                          ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                          : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        // ----------------------------------------------

                        return (
                          <circle 
                            key={i} 
                            cx={cx} 
                            cy={cy} 
                            r={6} 
                            fill="#fff" 
                            stroke={currentSkillColor} 
                            strokeWidth="2" 
                            style={{ cursor: 'pointer' }}
                          >
                            <title>{`On ${dateText}, ${p.y}% of ${jobInput} jobs ${locationInput ? `in ${locationInput}` : ''} required ${selectedSkill}`}</title>
                          </circle>
                        );
                      })}
                    </svg>
                    <div style={{ position: "absolute", top: "100%", left: 0, right: 0, height: "20px", marginTop: "10px" }}>
                      {getAxisTicks().map((date, i) => {
                        // Determine if we should show the day (DD/MM) or just Month/Year
                        const isDaily = timeLimit === '1w' || timeLimit === '2w';
                        const label = isDaily 
                          ? date.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' }) // e.g., 15/01
                          : date.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' }); // e.g., 01/2026

                        return (
                          <span 
                            key={i} 
                            style={{ 
                              position: 'absolute', 
                              left: `${(i / 4) * 100}%`, 
                              transform: 'translateX(-50%)', 
                              fontSize: "0.75rem", 
                              fontWeight: "bold", 
                              whiteSpace: "nowrap" 
                            }}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  </>
                ) : <div style={{ textAlign: "center", color: "#999", paddingTop: "80px" }}>Select a skill to see history</div>}
              </div>
            </div>

            <div style={{ opacity: selectedSkill ? 1 : 0.5, marginTop: "30px" }}>
              <div style={{ background: "#f8fafc", padding: "5px 15px", borderRadius: "20px", display: "inline-block", marginBottom: "10px", fontWeight: "bold", border: `2px solid ${currentSkillColor}` }}>Top TUM courses teaching {selectedSkill || "..."}</div>
              <div style={{ border: `2px solid ${currentSkillColor}`, borderRadius: "8px", overflow: "hidden", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                {coursesData && coursesData.length > 0 ? coursesData.map((c, i) => (
                  <div key={i} style={{ padding: "12px", borderBottom: i === coursesData.length - 1 ? "none" : "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <a href={c.url} target="_blank" rel="noopener noreferrer" style={{ color: "#000", fontWeight: "500", textDecoration: "none" }}>{c.title}</a>
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

export default SearchByJob;