/**
 * ============================================================================
 * MOCK API - Job Search and Analysis Functions
 * ============================================================================
 */

import { JOBS_DEMO, TUM_COURSES } from './mock_database.js';

/**
 * Simulate network delay
 */
function delay(ms = 200) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * SearchByJob: Returns skill distribution for a specific job & location
 * Denominator: Total jobs found for that title.
 */
export async function searchByJob({ job, location, timeLimit = "all" } = {}) {
  await delay(200);
  
  let filtered = JOBS_DEMO;
  if (timeLimit !== "all") {
    const now = new Date();
    const timeMap = { "1w": 7, "2w": 14, "1m": 30, "3m": 90 };
    // To this (Immutable):
    const daysToSubtract = timeMap[timeLimit];
    const cutoff = new Date(now.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
    filtered = JOBS_DEMO.filter(j => new Date(j.date_posted) >= cutoff);
  }

  const matchingJobs = filtered.filter(j => {
    if (job && j.title.toLowerCase() !== job.toLowerCase()) return false;
    if (location && !j.location.toLowerCase().includes(location.toLowerCase())) return false;
    return true;
  });
  
  if (matchingJobs.length === 0) {
    return { success: true, job, location, total_jobs: 0, skills: {} };
  }
  
  const skillsCount = {};
  matchingJobs.forEach(j => {
    j.skills.forEach(skill => {
      skillsCount[skill] = (skillsCount[skill] || 0) + 1;
    });
  });
  
  const total = matchingJobs.length;
  const skillsStats = {};
  
  Object.entries(skillsCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([skill, count]) => {
      skillsStats[skill] = {
        count,
        percentage: Number(((count / total) * 100).toFixed(1))
      };
    });
  
  return { success: true, job, location, total_jobs: total, skills: skillsStats };
}

/**
 * searchBySkills: Find jobs matching user's skills
 */
export async function searchBySkills({ skills, location } = {}) {
  await delay(200);
  const userSkillsLower = (skills || []).map(s => s.toLowerCase());

  const matchingJobs = JOBS_DEMO.filter(j => {
    if (location && !j.location.toLowerCase().includes(location.toLowerCase())) return false;
    const jobSkillsLower = j.skills.map(s => s.toLowerCase());
    return userSkillsLower.some(skill => jobSkillsLower.includes(skill));
  });

  if (matchingJobs.length === 0) {
    return { success: true, user_skills: skills, location, total_jobs: 0, jobs: {} };
  }

  const jobsCount = {};
  matchingJobs.forEach(j => {
    jobsCount[j.title] = (jobsCount[j.title] || 0) + 1;
  });

  const total = matchingJobs.length;
  const jobsStats = {};
  Object.entries(jobsCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([title, count]) => {
      jobsStats[title] = {
        count,
        percentage: Number(((count / total) * 100).toFixed(1))
      };
    });

  return { success: true, user_skills: skills, location, total_jobs: total, jobs: jobsStats };
}

/**
 * getSkillTrendData: Get coordinates for the line chart
 * Denominator: Total jobs of that specific title in that specific month.
 */
export async function getSkillTrendData(skillName, jobField = "", location = "", timeLimit = "all") {
  await delay(300);
  let filtered = JOBS_DEMO;
  const now = new Date();
  let isShortTerm = (timeLimit === "1w" || timeLimit === "2w");

  if (timeLimit !== "all") {
    const days = { "1w": 7, "2w": 14, "1m": 30, "3m": 90 }[timeLimit];
    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    filtered = JOBS_DEMO.filter(j => new Date(j.date_posted) >= cutoff);
  }

  const relevantJobs = filtered.filter(job => {
    const matchJob = !jobField || job.title.toLowerCase().includes(jobField.toLowerCase());
    const matchLoc = !location || job.location.toLowerCase().includes(location.toLowerCase());
    return matchJob && matchLoc;
  });

  const timeBuckets = {};
  // Inside getSkillTrendData in mockApi.js
  // Inside getSkillTrendData in mockApi.js
  relevantJobs.forEach(job => {
      const d = new Date(job.date_posted);
      let key;

      if (timeLimit === "1w" || timeLimit === "2w") {
          // Daily: 2026-01-20
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else if (timeLimit === "1m" || timeLimit === "3m") {
          // Weekly: Group by the first day of the week (e.g., 1st, 8th, 15th, 22nd)
          const weekStartDay = Math.floor((d.getDate() - 1) / 7) * 7 + 1;
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(weekStartDay).padStart(2, '0')}`;
      } else {
          // Monthly: 2026-01
          key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!timeBuckets[key]) timeBuckets[key] = { total: 0, skillMatches: 0 };
      timeBuckets[key].total++;
      if (job.skills.some(s => s.toLowerCase().includes(skillName.toLowerCase()))) {
          timeBuckets[key].skillMatches++;
      }
  });

  return Object.entries(timeBuckets)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, stats]) => {
          const p = key.split('-');
          // IMPORTANT: Always return 3 parts if it's not "all" data
          // This ensures the frontend parseDate(parts.length === 3) logic works
          const displayX = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : `01/${p[1]}/${p[0]}`;
          return { x: displayX, y: Number(((stats.skillMatches / stats.total) * 100).toFixed(1)) };
      });
}
/**
 * getSkillDistributionForJob: Pie Chart Logic
 * Denominator: Total mentions of all skills.
 */
export async function getSkillDistributionForJob({ job, location } = {}) {
  await delay(200);
  const matchingJobs = JOBS_DEMO.filter(j => {
    if (job && j.title.toLowerCase() !== job.toLowerCase()) return false;
    if (location && !j.location.toLowerCase().includes(location.toLowerCase())) return false;
    return true;
  });
  
  if (matchingJobs.length === 0) return { success: true, job, location, total_jobs: 0, skills: {} };
  
  const skillsCount = {};
  let totalMentions = 0;

  matchingJobs.forEach(j => {
    j.skills.forEach(skill => {
      skillsCount[skill] = (skillsCount[skill] || 0) + 1;
      totalMentions++;
    });
  });
  
  const skillsStats = {};
  Object.entries(skillsCount).forEach(([skill, count]) => {
    skillsStats[skill] = {
      count,
      percentage: Number(((count / totalMentions) * 100).toFixed(1))
    };
  });
  
  return { success: true, job, location, total_jobs: matchingJobs.length, skills: skillsStats };
}

/**
 * getJobFieldsBySkill: Find which job titles use a specific skill the most.
 */
/**
 * getJobFieldsBySkill: Find which job titles use a specific skill the most,
 * filtered by location and time period.
 */
export async function getJobFieldsBySkill(skillName, location = "", timeLimit = "all") {
  await delay(200);
  let filtered = JOBS_DEMO;
  if (timeLimit !== "all") {
    const days = { "1w": 7, "2w": 14, "1m": 30, "3m": 90 }[timeLimit];
    const cutoff = new Date(new Date().getTime() - (days * 24 * 60 * 60 * 1000));
    filtered = JOBS_DEMO.filter(j => new Date(j.date_posted) >= cutoff);
  }

  const stats = {};
  filtered.forEach(job => {
    if (location && !job.location.toLowerCase().includes(location.toLowerCase())) return;
    
    if (!stats[job.title]) stats[job.title] = { total: 0, withSkill: 0 };
    stats[job.title].total++;
    if (job.skills.some(s => s.toLowerCase().includes(skillName.toLowerCase()))) {
      stats[job.title].withSkill++;
    }
  });

  return Object.entries(stats)
    .map(([title, data]) => ({
      title,
      percentage: Number(((data.withSkill / data.total) * 100).toFixed(1))
    }))
    .filter(f => f.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);
}

// Ensure you add getJobFieldsBySkill to your export default at the bottom!

export async function getTUMCoursesBySkill(skillName) {
  if (!skillName) return [];
  return TUM_COURSES.filter(course => 
    course.skills.some(s => s.toLowerCase().includes(skillName.toLowerCase()))
  ).slice(0, 5);
}

// Named exports and default export for flexibility
export default { 
  getSkillTrendData, 
  getTUMCoursesBySkill,
  getJobFieldsBySkill,
  searchByJob,
  getSkillDistributionForJob,
  searchBySkills
};