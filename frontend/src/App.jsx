/**
 * App.jsx - Main React application router
 * 
 * Routes:
 * - / : HomePage with 3 main navigation buttons
 * - /search/skills : Search jobs by user's skills
 * - /search/job : Search skill requirements for a job
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import HomePage from "./pages/HomePage.jsx";
import SearchBySkills from "./pages/SearchBySkills.jsx";
import SearchByJob from "./pages/SearchByJob.jsx";
import HistoricalStats from "./pages/HistoricalStats.jsx";
import Sidebar from "./components/Sidebar.jsx";
import { useState } from "react";

function App() {
  // Sidebar open state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Hamburger button style
  const hamburgerStyle = {
    position: "fixed",
    top: 24,
    left: 24,
    zIndex: 1100,
    background: "#1f2937",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    width: 44,
    height: 44,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "2rem",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
  };

  return (
    <Router>
      {/* Hamburger button to open sidebar (hidden when sidebar is open) */}
      {!sidebarOpen && (
        <button style={hamburgerStyle} onClick={() => setSidebarOpen(true)} aria-label="Open menu">
          &#9776;
        </button>
      )}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search/skills" element={<SearchBySkills />} />
        <Route path="/search/job" element={<SearchByJob />} />
        <Route path="/historical" element={<HistoricalStats />} />
      </Routes>
    </Router>
  );
}

export default App;