import { useNavigate } from "react-router-dom";
import { useState } from "react";

const sidebarStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  width: 320, // Slightly wider to accommodate longer phrases comfortably
  background: "#1f2937",
  color: "#fff",
  boxShadow: "2px 0 8px rgba(0, 0, 0, 0.5)", // Darker shadow for better contrast
  zIndex: 1000,
  display: "flex",
  flexDirection: "column",
  padding: "2rem 1.5rem 1rem 1.5rem",
  transition: "transform 0.3s",
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.4)",
  zIndex: 999,
};

// Base style for buttons
const buttonBaseStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  marginBottom: "1.5rem",
  background: "none",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  cursor: "pointer",
  textAlign: "left",
  lineHeight: "1.4",
  padding: "10px",
  borderRadius: "8px",
  transition: "background 0.2s",
  width: "100%",
};

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);

  if (!open) return null;

  const NavButton = ({ to, label, icon, id }) => (
    <button
      style={{
        ...buttonBaseStyle,
        background: hovered === id ? "rgba(255,255,255,0.1)" : "none",
      }}
      onMouseEnter={() => setHovered(id)}
      onMouseLeave={() => setHovered(null)}
      onClick={() => {
        navigate(to);
        onClose();
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <nav style={sidebarStyle}>
        <button
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "2rem",
            cursor: "pointer",
            zIndex: 1101,
          }}
          aria-label="Close menu"
          onClick={onClose}
        >
          &#8592;
        </button>

        <h2 style={{ marginBottom: "2.5rem", fontSize: "1.5rem", fontWeight: 700, paddingLeft: "10px" }}>Menu</h2>

        <NavButton
          id="home"
          to="/"
          label="Home"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
          }
        />

        <NavButton
          id="skills"
          to="/search/skills"
          label="See where your skills can take you"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          }
        />

        <NavButton
          id="job"
          to="/search/job"
          label="Find Skills for your Dream Job"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
            </svg>
          }
        />

        <NavButton
          id="historical"
          to="/historical"
          label="Skill Analysis"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          }
        />
      </nav>
    </>
  );
}

export default Sidebar;