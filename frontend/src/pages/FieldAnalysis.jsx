import { useEffect, useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { reportJobTitleDetails } from "../lib/apiClient";

const PIE_COLORS = [
  "#86efac", "#fde047", "#93c5fd", "#fca5a5", 
  "#d8b4fe", "#fdba74", "#cbd5e1", "#6ee7b7", 
  "#f9a8d4", "#c4b5fd", "#94a3b8", "#a7f3d0"
];

function FieldAnalysis() {
  const [searchParams] = useSearchParams(); // Get URL search parameters
  const navigate = useNavigate(); // Navigation hook

  const jobTitle = searchParams.get("field"); // Job field from URL
  const skillsParam = searchParams.get("skills"); // Skills from URL
  const location = searchParams.get("location"); // Location from URL
  const timeLimit = searchParams.get("timeLimit") || "1m"; // Time limit from URL or default to 1 month

  const selectedSkills = useMemo(() => skillsParam ? skillsParam.split(",") : [], [skillsParam]); // Parse skills into array

  const [loading, setLoading] = useState(true); // Loading state
  const [details, setDetails] = useState(null); // Job field details
  const [limit, setLimit] = useState(10); // Default Top 10

  useEffect(() => {
    if (!jobTitle) return; // Exit if no job title

    // Fetch job title details based on parameters

    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await reportJobTitleDetails({ // API call
          jobTitle, // Job title
          skills: selectedSkills, // Selected skills
          location: location || null, // Location or null
          timeWindow: timeLimit, // Time window
        });
        setDetails(data);
      } catch (err) { // Error handling
        console.error("Failed to fetch field details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobTitle, selectedSkills, location, timeLimit]);

  const getJobUrl = (job) => { // Resolve possible URL fields from API result objects
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

  const normalizedTopSkills = useMemo(() => { // Normalize top skills data
    if (!details || !details.top_skills) return []; // Return empty array if no data
    return details.top_skills.map((s) => ({ // Map each skill
      name: s.name, // Skill name
      count: Number(s.count || 0), // Skill count
      percent: Number((s.percent ?? 0)), // Skill percentage
    }));
  }, [details]);

  const displayedSkills = useMemo(() => {
    if (limit === "All") return normalizedTopSkills; // Return all skills if limit is "All"
    return normalizedTopSkills.slice(0, Number(limit)); // Slice array to limit
  }, [normalizedTopSkills, limit]);

  // Find max percent for bar scaling
  const maxPercent = useMemo(() => {
    if (normalizedTopSkills.length === 0) return 1; // Avoid division by zero
    return Math.max(...normalizedTopSkills.map(s => s.percent)); // Get max percent
  }, [normalizedTopSkills]);

  if (!jobTitle) {
    return <div style={{ padding: 20 }}>Invalid Job Field</div>;
  }

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
        <h1 style={{ fontSize: "2.5rem", margin: "0 0 10px 0", color: "#1f2937" }}>Job Field Analysis</h1>
        <p style={{ color: "#666", fontSize: "1.1rem" }}>
          Detailed insights for the {jobTitle} role based on your skills and market data.
        </p>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#64748b" }}>Loading analysis...</div>
      ) : (
        <div>
           {/* Info Header */}
           <div style={{ marginBottom: 30 }}>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px' }}>
              Job field: <span style={{ color: '#2563eb' }}>{jobTitle}</span>
            </h2>
            <div style={{ marginTop: 6, color: '#64748b', fontSize: 16 }}>
              {details?.total_jobs ? (
                <strong style={{ fontSize: 18, color: '#0f172a' }}>{details.total_jobs}</strong>
              ) : (
                <span>-</span>
              )} total announcements
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
            
            {/* LEFT SIDE: Skills Bar Chart */}
            <div style={{ flex: 1, minWidth: '300px', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h3 style={{ margin: 0, color: '#333' }}>Top Skills Required</h3>
                <select 
                  value={limit} 
                  onChange={(e) => setLimit(e.target.value)}
                  style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                  <option value="All">All</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {displayedSkills.map((skill, idx) => (
                  <div key={skill.name} style={{ width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                        <span>{skill.name}</span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>{skill.count} jobs ({skill.percent}%)</span>
                    </div>
                    {/* Bar Background */}
                    <div style={{ width: "100%", backgroundColor: "#f1f5f9", borderRadius: "6px", height: "24px", position: "relative", overflow: "hidden" }}>
                        {/* Bar Foreground */}
                        <div style={{ 
                            width: `${Math.max((skill.percent / (maxPercent || 1)) * 100, 1)}%`, 
                            height: "100%", 
                            backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                            transition: "width 0.5s ease"
                        }} />
                    </div>
                  </div>
                ))}
                {displayedSkills.length === 0 && (
                  <div style={{ padding: '12px', color: '#94a3b8' }}>No skills data available.</div>
                )}
              </div>
            </div>

            {/* RIGHT SIDE: Top Companies & Announcements */}
            <div style={{ flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Top 3 Companies */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>Top 3 Companies</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(details?.top_companies || []).map((comp, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                      <span style={{ fontWeight: '600', color: '#334155' }}>{idx + 1}. {comp.name}</span>
                      <span style={{ backgroundColor: '#dbeafe', color: '#1e40af', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{comp.count} jobs</span>
                    </div>
                  ))}
                  {(!details?.top_companies || details.top_companies.length === 0) && (
                     <div style={{ color: "#94a3b8" }}>No company data available.</div>
                  )}
                </div>
              </div>

              {/* Last 5 Announcements for this field */}
              <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flex: 1 }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>Last 5 Announcements</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(details?.last_announcements || []).map((job) => (
                    <a // Announcement Link
                      key={job.id} // Use job ID as key
                      href={getJobUrl(job)} // Resolve URL
                      target="_blank" // Open in new tab
                      rel="noopener noreferrer" // Security attributes
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
                   {(!details?.last_announcements || details.last_announcements.length === 0) && (
                     <div style={{ color: "#94a3b8" }}>No announcement data available.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FieldAnalysis;
