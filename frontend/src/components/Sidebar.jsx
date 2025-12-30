import { useNavigate } from "react-router-dom";

const sidebarStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  height: "100vh",
  width: 280, // Increased width to fit longer text
  background: "#1f2937",
  color: "#fff",
  boxShadow: "2px 0 8px rgba(255, 255, 255, 1)",
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
  background: "rgba(0,0,0,0.2)",
  zIndex: 999,
};

const buttonStyle = {
  marginBottom: "1.5rem",
  background: "none",
  color: "#fff",
  border: "none",
  fontSize: "1.1rem",
  cursor: "pointer",
  textAlign: "left",
  lineHeight: "1.4", // Better spacing for multi-line text
  padding: 0
};

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  if (!open) return null;
  
  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <nav style={sidebarStyle}>
        {/* Close arrow in the top right of the sidebar */}
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
            zIndex: 1101
          }}
          aria-label="Close menu"
          onClick={onClose}
        >
          &#8592;
        </button>
        
        <h2 style={{ marginBottom: "2.5rem", fontSize: "1.5rem", fontWeight: 700 }}>Menu</h2>
        
        <button 
          style={buttonStyle} 
          onClick={() => { navigate("/"); onClose(); }}
        >
          Home
        </button>
        
        <button 
          style={buttonStyle} 
          onClick={() => { navigate("/search/skills"); onClose(); }}
        >
          See where your skills can take you
        </button>
        
        <button 
          style={buttonStyle} 
          onClick={() => { navigate("/search/job"); onClose(); }}
        >
          Find Skills for your Dream Job
        </button>
        
        <button 
          style={buttonStyle} 
          onClick={() => { navigate("/historical"); onClose(); }}
        >
          Discover the story behind your skill & how to grow it
        </button>
        
      </nav>
    </>
  );
}

export default Sidebar;