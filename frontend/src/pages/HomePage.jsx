import { useNavigate } from "react-router-dom";
import { useState } from "react";

// --- CSS Keyframes for Animations ---
const globalStyles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

function HomePage() {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [titleHover, setTitleHover] = useState(false);

  // Configuration for the three main actions with ICONS
  const actions = [
    {
      title: "See where your skills can take you",
      // Reverted to original text
      description: "Enter your skills and find the most recent job postings that match your strengths.",
      color: "#93c5fd", 
      path: "/search/skills",
      // Icon: Compass / Navigation
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      )
    },
    {
      title: "Find Skills for your Dream Job",
      // Reverted to original text
      description: "Discover the essential skills for any job, explore recommended courses and view trend statistics.",
      color: "#6ee7b7", 
      path: "/search/job",
      // Icon: Briefcase
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
        </svg>
      )
    },
    {
      title: "Discover the story behind your skill & how to grow it",
      // Reverted to original text
      description: "Check demand trends for any skill and find TUM courses to build that skill.",
      color: "#d1c4e9", 
      path: "/historical",
      // Icon: Trending Up Graph
      icon: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
          <polyline points="17 6 23 6 23 12"></polyline>
        </svg>
      )
    }
  ];

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "2rem",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "sans-serif",
      position: "relative",
      backgroundColor: "#f9fafb",
      backgroundImage:  `radial-gradient(#e5e7eb 1px, transparent 1px), radial-gradient(#e5e7eb 1px, transparent 1px)`,
      backgroundSize: '24px 24px',
      backgroundPosition: '0 0, 12px 12px',
    }}>
      <style children={globalStyles} />

      {/* Placeholder for sidebar button */}
      <div style={{position: 'absolute', top: 0, left: 0}}></div>

      {/* Hero Section */}
      <div style={{ marginBottom: "5rem", textAlign: "center", marginTop: "2rem", position: "relative", zIndex: 2 }}>
        
        {/* Title "Pop & Wiggle" on Hover */}
        <h1 
          onMouseEnter={() => setTitleHover(true)}
          onMouseLeave={() => setTitleHover(false)}
          style={{ 
            fontSize: "4rem", 
            marginBottom: "1rem", 
            color: "#1f2937", 
            fontWeight: "800",
            letterSpacing: "-2px",
            cursor: "default",
            transform: titleHover ? "scale(1.05) rotate(-2deg)" : "scale(1) rotate(0deg)",
            textShadow: titleHover ? "4px 4px 0px #fca5a5" : "none", 
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)" 
          }}
        >
          Employeah!
        </h1>
        
        {/* Static Subtitle */}
        <p style={{ 
          fontSize: "1.2rem", 
          color: "#4b5563", 
          maxWidth: "600px", 
          margin: "0 auto",
          lineHeight: "1.6"
        }}>
          Explore job market trends, find positions matching your skills, and discover how skill demand evolves over time.
        </p>
      </div>

      {/* Navigation Cards */}
      <section style={{ 
        display: "flex", 
        gap: "2.5rem", 
        flexWrap: "wrap", 
        justifyContent: "center",
        width: "100%",
        zIndex: 2
      }}>
        {actions.map((action, index) => (
          <div
            key={index}
            onClick={() => navigate(action.path)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            style={{
              background: action.color,
              padding: "2.5rem 2rem",
              borderRadius: "16px",
              border: "2px solid #1f2937",
              width: "320px",
              minHeight: "420px", 
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              opacity: 0, 
              animation: `fadeInUp 0.6s ease-out forwards ${index * 0.15}s`,
              transform: hoveredIndex === index ? "translateY(-10px) scale(1.02)" : "translateY(0) scale(1)",
              boxShadow: hoveredIndex === index 
                ? "10px 10px 0px #1f2937" 
                : "4px 4px 0px #1f2937",
              transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out"
            }}
          >
            <div>
              {/* Icon Container */}
              <div style={{ marginBottom: "1.5rem" }}>
                {action.icon}
              </div>

              <h2 style={{ 
                fontSize: "1.6rem", 
                fontWeight: "700", 
                marginBottom: "1rem", 
                color: "#1f2937",
                lineHeight: "1.2"
              }}>
                {action.title}
              </h2>
              <p style={{ 
                fontSize: "1.05rem", 
                color: "#1f2937", 
                lineHeight: "1.5",
                opacity: 0.85, 
                fontWeight: "500"
              }}>
                {action.description}
              </p>
            </div>

            {/* Animated Arrow */}
            <div style={{ 
              marginTop: "2rem", 
              fontSize: "1.8rem", 
              fontWeight: "bold",
              color: "#1f2937",
              transform: hoveredIndex === index ? "translateX(12px)" : "translateX(0)",
              transition: "transform 0.2s ease-in-out"
            }}>
              →
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

export default HomePage;