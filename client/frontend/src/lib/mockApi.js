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

import { JOBS_DEMO } from './mock_database.js';

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

export default { searchByJob, searchBySkills, getHistoricalStats };