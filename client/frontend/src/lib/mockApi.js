/**
 * ============================================================================
 * MOCK API - Job Search and Analysis Functions
 * ============================================================================
 * 
 * This module provides three functions for job search and analysis.
 * Uses local Python modules: search_by_job.py, search_by_skills.py, historical_stats.py
 * 
 * All logic is contained within this frontend folder - no external backend needed.
 * 
 * EXPORTS:
 * - searchByJob({job, location}) - Find skill requirements for a job
 * - searchBySkills({skills, location}) - Find jobs matching user's skills
 * - getHistoricalStats({job, location}) - View skill trends over time
 * ============================================================================
 */

import { JOBS_DEMO, TUM_COURSES } from './mock_database.js';

/**
 * Simulate network delay to make responses feel realistic
 */
function delay(ms = 200) {
  return new Promise(res => setTimeout(res, ms));
}

/**
 * Search for skill requirements for a specific job title
 * Filters only announcements from the last 3 months.
 * 
 * @param {string} job - Job title (e.g., "Data Scientist")
 * @param {string} location - Optional location filter
 * @returns {Promise<Object>} with success, job, location, total_jobs, skills
 */
export async function searchByJob({ job, location } = {}) {
  await delay(200);
  // Conteggia tutti i dati, nessun filtro temporale
  const matchingJobs = JOBS_DEMO.filter(j => {
    if (job && j.title.toLowerCase() !== job.toLowerCase()) return false;
    if (location && j.location.toLowerCase() !== location.toLowerCase()) return false;
    return true;
  });
  
  if (matchingJobs.length === 0) {
    return {
      success: true,
      job,
      location,
      total_jobs: 0,
      skills: {}
    };
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
        percentage: Number(((count / total) * 100).toFixed(2))
      };
    });
  
  return {
    success: true,
    job,
    location,
    total_jobs: total,
    skills: skillsStats
  };
}

/**
 * Find jobs matching user's skills
 * Filters only announcements from the last 3 months.
 * 
 * @param {Array<string>} skills - User's skills
 * @param {string} location - Optional location filter
 * @returns {Promise<Object>} with success, user_skills, location, total_jobs, jobs
 */
export async function searchBySkills({ skills, location } = {}) {
  await delay(200);
  const userSkillsLower = skills.map(s => s.toLowerCase());
  // Conteggia tutti i dati, nessun filtro temporale
  const matchingJobs = JOBS_DEMO.filter(j => {
    if (location && j.location.toLowerCase() !== location.toLowerCase()) return false;
    const jobSkillsLower = j.skills.map(s => s.toLowerCase());
    return userSkillsLower.some(skill => jobSkillsLower.includes(skill));
  });
  
  if (matchingJobs.length === 0) {
    return {
      success: true,
      user_skills: skills,
      location,
      total_jobs: 0,
      jobs: {}
    };
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
        percentage: Number(((count / total) * 100).toFixed(2))
      };
    });
  
  return {
    success: true,
    user_skills: skills,
    location,
    total_jobs: total,
    jobs: jobsStats
  };
}

/**
 * Get historical skill trends over time periods
 * Filters only announcements older than 3 months.
 * Groups data by 6-month periods.
 * 
 * @param {string} job - Job title (required)
 * @param {string} location - Optional location filter
 * @returns {Promise<Object>} with success, job, location, periods
 */
export async function getHistoricalStats({ job, location } = {}) {
  await delay(200);
  
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate());
  
  const matchingJobs = JOBS_DEMO.filter(j => {
    if (job && j.title.toLowerCase() !== job.toLowerCase()) return false;
    if (location && j.location.toLowerCase() !== location.toLowerCase()) return false;
    const posted = new Date(j.date_posted);
    if (posted >= threeMonthsAgo) return false;
    return true;
  });
  
  if (matchingJobs.length === 0) {
    return {
      success: true,
      job,
      location,
      periods: []
    };
  }
  
  const periodsData = {};
  
  matchingJobs.forEach(jobItem => {
    const posted = new Date(jobItem.date_posted);
    const year = posted.getFullYear();
    const month = posted.getMonth() + 1;
    
    const periodNum = Math.floor((month - 1) / 6);
    const periodStartMonth = (periodNum * 6) + 1;
    const periodEndMonth = Math.min((periodNum + 1) * 6, 12);
    
    const periodKey = `${year}-${String(periodStartMonth).padStart(2, '0')} to ${year}-${String(periodEndMonth).padStart(2, '0')}`;
    
    if (!periodsData[periodKey]) {
      periodsData[periodKey] = { jobs: [], skills: {} };
    }
    
    periodsData[periodKey].jobs.push(jobItem);
    jobItem.skills.forEach(skill => {
      periodsData[periodKey].skills[skill] = (periodsData[periodKey].skills[skill] || 0) + 1;
    });
  });
  
  const results = [];
  Object.keys(periodsData)
    .sort()
    .forEach(periodKey => {
      const periodInfo = periodsData[periodKey];
      const totalJobs = periodInfo.jobs.length;
      
      const skillsStats = {};
      Object.entries(periodInfo.skills)
        .sort((a, b) => b[1] - a[1])
        .forEach(([skill, count]) => {
          const percentage = Number(((count / totalJobs) * 100).toFixed(2));
          skillsStats[skill] = { count, percentage };
        });
      
      results.push({
        period: periodKey,
        jobs_count: totalJobs,
        skills: skillsStats
      });
    });
  
  return {
    success: true,
    job,
    location,
    periods: results
  };
}





/**
 * Helper to get the ISO week number (YYYY-Www)
 */
function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}
/**
 * Get monthly trend coordinates (X = MM.YYYY, Y = Percentage)
 */
export async function getSkillTrendData(skillName, jobField = "") {
  await delay(300);
  if (!skillName) return [];

  const monthlyStats = {};

  JOBS_DEMO.forEach(job => {
    // 1. Filter by Job Field first. 
    // If jobField is set, 'totalJobs' will represent ONLY that specific job type.
    if (jobField && job.title.toLowerCase() !== jobField.toLowerCase()) return;

    const date = new Date(job.date_posted);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const key = `${year}-${month}`; // Sorting key (YYYY-MM)
    
    if (!monthlyStats[key]) {
      monthlyStats[key] = { totalJobs: 0, skillMatches: 0 };
    }

    monthlyStats[key].totalJobs += 1;
    
    // 2. Check if this job has the specific skill
    const hasSkill = job.skills.some(s => s.toLowerCase() === skillName.toLowerCase());
    if (hasSkill) {
      monthlyStats[key].skillMatches += 1;
    }
  });

  // 3. Convert to array and format X label as MM.YYYY
  return Object.entries(monthlyStats)
    .sort((a, b) => a[0].localeCompare(b[0])) // Sort chronologically
    .map(([key, stats]) => {
      const [year, month] = key.split('-');
      return {
        x: `${month}.${year}`, // User requested format: 01.2023
        y: Number(((stats.skillMatches / stats.totalJobs) * 100).toFixed(1))
      };
    });
}


export async function getJobFieldsBySkill(skillName) {
  const stats = {};

  // 1. Scan all jobs to count totals per title
  JOBS_DEMO.forEach(job => {
    const title = job.title;
    
    if (!stats[title]) {
      stats[title] = { totalPostings: 0, withSkill: 0 };
    }
    
    // Count every job of this title (e.g. every "Data Scientist" found)
    stats[title].totalPostings += 1;
    
    // Check if this specific job listing has the skill
    const hasSkill = job.skills.some(s => s.toLowerCase() === skillName.toLowerCase());
    if (hasSkill) {
      stats[title].withSkill += 1;
    }
  });

  // 2. Calculate percentage within each job title
  return Object.entries(stats)
    // Only keep job titles that actually use the skill at least once
    .filter(([_, data]) => data.withSkill > 0)
    .map(([title, data]) => ({
      title,
      // Formula: (Jobs with Skill / Total Jobs in that Field) * 100
      percentage: Number(((data.withSkill / data.totalPostings) * 100).toFixed(1))
    }))
    // Sort by highest percentage (most dependent on this skill)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5);
}

export async function getTUMCoursesBySkill(skillName) {
  if (!skillName) return [];
  
  return TUM_COURSES.filter(course => 
    course.skills.some(s => s.toLowerCase().includes(skillName.toLowerCase()))
  ).slice(0, 5);
}

// Dummy exports to keep existing code working if referenced elsewhere



export default { 
  getSkillTrendData, 
  getJobFieldsBySkill, 
  getTUMCoursesBySkill,
  searchByJob,
  searchBySkills,
  getHistoricalStats
};