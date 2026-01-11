async function apiFetch(path, { method = "GET", body, headers } = {}) {
  const res = await fetch(path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(headers || {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${method} ${path} failed: ${res.status} ${text}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null;
  return await res.json();
}

export async function getJobTitles() {
  return await apiFetch("/api/v1/job-titles");
}

export async function getLocations() {
  return await apiFetch("/api/v1/locations");
}

export async function getSkills({ q = "", limit = 20 } = {}) {
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (limit) qs.set("limit", String(limit));
  return await apiFetch(`/api/v1/skills?${qs.toString()}`);
}

export async function getCoursesForSkill(skill, { limit = 5 } = {}) {
  const qs = new URLSearchParams();
  if (limit) qs.set("limit", String(limit));
  return await apiFetch(`/api/v1/skills/${encodeURIComponent(skill)}/courses?${qs.toString()}`);
}

export async function getJobSkillDistribution({ jobTitle, location } = {}) {
  const qs = new URLSearchParams();
  qs.set("job_title", jobTitle || "");
  if (location) qs.set("location", location);
  return await apiFetch(`/api/v1/reports/job-skill-distribution?${qs.toString()}`);
}

export async function getSkillTrend({ skill, jobTitle, location } = {}) {
  const qs = new URLSearchParams();
  qs.set("skill", skill || "");
  if (jobTitle) qs.set("job_title", jobTitle);
  if (location) qs.set("location", location);
  qs.set("bucket", "month");
  return await apiFetch(`/api/v1/reports/skill-trend?${qs.toString()}`);
}

export async function getSkillTopJobTitles({ skill, limit = 5 } = {}) {
  const qs = new URLSearchParams();
  qs.set("skill", skill || "");
  qs.set("limit", String(limit));
  return await apiFetch(`/api/v1/reports/skill-top-job-titles?${qs.toString()}`);
}

export async function reportJobsBySkills({ skills, location, timeWindow } = {}) {
  return await apiFetch("/api/v1/reports/jobs-by-skills", {
    method: "POST",
    body: { skills: skills || [], location: location || null, time_window: timeWindow || "1m" },
  });
}

export async function reportJobTitleDetails({ jobTitle, skills, location, timeWindow } = {}) {
  return await apiFetch("/api/v1/reports/job-title-details", {
    method: "POST",
    body: { job_title: jobTitle, skills: skills || [], location: location || null, time_window: timeWindow || "1m" },
  });
}

export async function getStats() {
  return await apiFetch("/api/v1/stats");
}

export default {
  getJobTitles,
  getLocations,
  getSkills,
  getCoursesForSkill,
  getJobSkillDistribution,
  getSkillTrend,
  getSkillTopJobTitles,
  reportJobsBySkills,
  reportJobTitleDetails,
  getStats,
};
