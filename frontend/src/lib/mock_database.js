 /**
 * Mock Database - Job Announcements Dataset
 * 
 * Source of truth for all job-related analysis.
 * Contains 36 job announcements with temporal data (date_posted, salary).
 * 
 * Used by:
 * - searchByJob()
 * - searchBySkills()
 * - getHistoricalStats()
 */

export const JOBS_DEMO = [
  // === New postings (Aug 2025 - Jan 2026) ===
  // === Newest Postings (Late 2025 - Jan 2026) ===
  { id: 49, title: 'AI Engineer', location: 'London', company: 'DeepScale', skills: ['Python', 'PyTorch', 'LLMs', 'NLP'], date_posted: '2026-01-19', salary: 89000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 50, title: 'Cloud Security Engineer', location: 'Remote', company: 'VaultGuard', skills: ['AWS', 'Terraform', 'Python', 'IAM'], date_posted: '2026-01-18', salary: 94000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 51, title: 'Mobile Developer', location: 'Berlin', company: 'AppFactory', skills: ['Swift', 'Kotlin', 'React Native'], date_posted: '2026-01-12', salary: 65000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 52, title: 'Data Scientist', location: 'Milan', company: 'LuxData', skills: ['Python', 'Statistics', 'SQL', 'R'], date_posted: '2026-01-05', salary: 62000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 53, title: 'Platform Engineer', location: 'Amsterdam', company: 'NextStep', skills: ['Kubernetes', 'Go', 'Docker', 'GCP'], date_posted: '2025-12-28', salary: 83000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 54, title: 'Frontend Developer', location: 'Paris', company: 'ArtTech', skills: ['React', 'TypeScript', 'Tailwind', 'Framer'], date_posted: '2025-12-20', salary: 61000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 55, title: 'AI Ethics Specialist', location: 'Remote', company: 'Ethos AI', skills: ['Python', 'NLP', 'Policy', 'Statistics'], date_posted: '2025-12-15', salary: 75000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 56, title: 'Backend Developer', location: 'London', company: 'FlowPay', skills: ['Node.js', 'PostgreSQL', 'Redis', 'AWS'], date_posted: '2025-12-10', salary: 77000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 57, title: 'Data Architect', location: 'Berlin', company: 'BigSystems', skills: ['SQL', 'Snowflake', 'Python', 'Airflow'], date_posted: '2025-12-02', salary: 98000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 58, title: 'Cybersecurity Analyst', location: 'Remote', company: 'ZeroTrust', skills: ['SIEM', 'Python', 'Linux', 'Network Security'], date_posted: '2025-11-28', salary: 70000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 59, title: 'MLOps Engineer', location: 'Amsterdam', company: 'ModelAuto', skills: ['Kubeflow', 'Docker', 'Python', 'AWS'], date_posted: '2025-11-20', salary: 86000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 60, title: 'Embedded Systems Engineer', location: 'Milan', company: 'AutoBot', skills: ['C++', 'Python', 'Rust', 'Linux'], date_posted: '2025-11-15', salary: 72000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 61, title: 'Junior Data Analyst', location: 'London', company: 'InsightWorks', skills: ['SQL', 'Excel', 'Tableau', 'Python'], date_posted: '2025-11-05', salary: 45000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 62, title: 'Backend Developer', location: 'Remote', company: 'API Forge', skills: ['Go', 'gRPC', 'Docker', 'PostgreSQL'], date_posted: '2025-10-30', salary: 82000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 63, title: 'UI Studio Lead', location: 'Berlin', company: 'UI Studio', skills: ['Figma', 'React', 'CSS', 'Strategy'], date_posted: '2025-10-25', salary: 88000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 64, title: 'Data Engineer', location: 'Paris', company: 'StreamLab', skills: ['Python', 'Spark', 'Kafka', 'SQL'], date_posted: '2025-10-18', salary: 75000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 65, title: 'DevOps Lead', location: 'London', company: 'CloudGuard', skills: ['Kubernetes', 'Terraform', 'AWS', 'Python'], date_posted: '2025-10-05', salary: 95000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 66, title: 'Junior Backend Developer', location: 'Milan', company: 'FinEdge', skills: ['Java', 'Spring Boot', 'SQL'], date_posted: '2025-09-28', salary: 48000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 67, title: 'Product Manager', location: 'Remote', company: 'PixelSoft', skills: ['Agile', 'Jira', 'Data Analytics'], date_posted: '2025-09-20', salary: 74000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 68, title: 'Data Scientist', location: 'Berlin', company: 'ModelWorks', skills: ['Python', 'TensorFlow', 'Machine Learning'], date_posted: '2025-09-12', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 69, title: 'QA Engineer', location: 'Paris', company: 'QualityFirst', skills: ['Cypress', 'JavaScript', 'SQL'], date_posted: '2025-09-05', salary: 55000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 70, title: 'Solution Architect', location: 'London', company: 'EnterpriseFlow', skills: ['Microservices', 'System Design', 'Azure'], date_posted: '2025-09-01', salary: 92000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 37, title: 'AI Engineer', location: 'Remote', company: 'NeuralNet', skills: ['Python', 'PyTorch', 'LLMs', 'NLP'], date_posted: '2026-01-15', salary: 85000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 38, title: 'Cybersecurity Analyst', location: 'Amsterdam', company: 'SecureSphere', skills: ['SIEM', 'Ethical Hacking', 'Network Security'], date_posted: '2026-01-08', salary: 72000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 39, title: 'Full-Stack Developer', location: 'Paris', company: 'SwiftPay', skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'], date_posted: '2025-12-28', salary: 68000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 40, title: 'Cloud Architect', location: 'Remote', company: 'SkyHigh Solutions', skills: ['AWS', 'Terraform', 'Kubernetes', 'Python'], date_posted: '2025-12-12', salary: 92000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 41, title: 'Product Manager', location: 'London', company: 'Visionary Tech', skills: ['Agile', 'Scrum', 'Data Analytics', 'Jira'], date_posted: '2025-11-25', salary: 78000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 42, title: 'Site Reliability Engineer', location: 'Berlin', company: 'UptimePro', skills: ['Linux', 'Go', 'Prometheus', 'Docker'], date_posted: '2025-11-05', salary: 81000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 43, title: 'UX/UI Designer', location: 'Milan', company: 'CreativeLabs', skills: ['Figma', 'Adobe XD', 'Prototyping', 'CSS'], date_posted: '2025-10-20', salary: 54000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 44, title: 'Machine Learning Ops', location: 'Remote', company: 'DataOps Inc', skills: ['Kubeflow', 'Python', 'MLflow', 'Docker'], date_posted: '2025-10-02', salary: 88000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 45, title: 'Blockchain Developer', location: 'Amsterdam', company: 'ChainForge', skills: ['Solidity', 'Ethereum', 'Rust', 'Web3.js'], date_posted: '2025-09-15', salary: 82000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 46, title: 'QA Automation Engineer', location: 'London', company: 'QualityFirst', skills: ['Selenium', 'Cypress', 'JavaScript', 'Java'], date_posted: '2025-09-01', salary: 62000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 47, title: 'Data Analyst', location: 'Paris', company: 'MetricWorld', skills: ['SQL', 'Tableau', 'Excel', 'Python'], date_posted: '2025-08-18', salary: 59000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 48, title: 'Solution Architect', location: 'Remote', company: 'EnterpriseFlow', skills: ['Microservices', 'Java', 'Azure', 'System Design'], date_posted: '2025-08-05', salary: 95000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 101, title: 'Data Scientist', location: 'London', company: 'InsightWorks', skills: ['Python', 'SQL', 'Pandas'], date_posted: '2025-12-05', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 102, title: 'Data Scientist', location: 'London', company: 'InsightWorks', skills: [ 'SQL', 'Machine Learning', 'Pandas'], date_posted: '2026-01-20', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 103, title: 'Data Scientist', location: 'London', company: 'InsightWorks', skills: ['Python', 'SQL', 'Machine Learning', 'Pandas'], date_posted: '2026-01-18', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 104, title: 'Data Scientist', location: 'London', company: 'InsightWorks', skills: ['Python', 'SQL', 'Machine Learning', 'Pandas'], date_posted: '2026-01-14', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 105, title: 'Data Scientist', location: 'London', company: 'InsightWorks', skills: ['Python', 'SQL', 'Machine Learning', 'Pandas'], date_posted: '2025-12-20', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 106, title: 'Data Scientist', location: 'London', company: 'InsightWorks', skills: ['Python', 'SQL', 'Machine Learning', 'Pandas'], date_posted: '2026-01-05', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  // === Fresh postings (last ~3 months) ===
  { id: 29, title: 'Data Scientist', location: 'London', company: 'InsightWorks', skills: ['Python', 'SQL', 'Machine Learning', 'Pandas'], date_posted: '2025-12-05', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 30, title: 'Backend Developer', location: 'Remote', company: 'API Forge', skills: ['Node.js', 'Docker', 'PostgreSQL', 'AWS'], date_posted: '2025-11-28', salary: 74000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 31, title: 'Frontend Developer', location: 'Berlin', company: 'UI Studio', skills: ['React', 'TypeScript', 'CSS', 'Vite'], date_posted: '2025-11-20', salary: 58000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 32, title: 'Data Engineer', location: 'Remote', company: 'StreamLab', skills: ['Python', 'SQL', 'Airflow', 'Spark'], date_posted: '2025-11-12', salary: 72000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 33, title: 'DevOps Engineer', location: 'London', company: 'CloudGuard', skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS'], date_posted: '2025-11-02', salary: 79000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 34, title: 'Backend Developer', location: 'Milan', company: 'FinEdge', skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'], date_posted: '2025-10-25', salary: 71000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 35, title: 'Frontend Developer', location: 'Remote', company: 'PixelSoft', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'], date_posted: '2025-10-12', salary: 56000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 36, title: 'Data Scientist', location: 'Berlin', company: 'ModelWorks', skills: ['Python', 'TensorFlow', 'SQL', 'Statistics'], date_posted: '2025-09-18', salary: 67000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  
  // === Existing dataset ===
  { id: 1, title: 'Data Scientist', location: 'London', company: 'TechCorp', skills: ['Python', 'Pandas', 'SQL', 'Machine Learning'], date_posted: '2025-11-15', salary: 65000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 2, title: 'Data Scientist', location: 'Remote', company: 'DataFlow Inc', skills: ['Python', 'SQL', 'Statistics'], date_posted: '2025-10-10', salary: 60000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 3, title: 'Backend Developer', location: 'Remote', company: 'CloudSys', skills: ['Python', 'Docker', 'AWS', 'REST APIs'], date_posted: '2025-09-05', salary: 70000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 4, title: 'Frontend Developer', location: 'Milan', company: 'WebStudio', skills: ['React', 'JavaScript', 'CSS', 'TypeScript'], date_posted: '2025-08-20', salary: 55000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 5, title: 'Data Engineer', location: 'Berlin', company: 'BigData Solutions', skills: ['Python', 'SQL', 'AWS', 'Spark'], date_posted: '2025-07-15', salary: 67000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 6, title: 'Backend Developer', location: 'London', company: 'Enterprise Systems', skills: ['Java', 'Docker', 'Kubernetes', 'SQL'], date_posted: '2025-06-10', salary: 72000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 7, title: 'Frontend Developer', location: 'Remote', company: 'StartupX', skills: ['React', 'TypeScript', 'Next.js'], date_posted: '2025-05-05', salary: 53000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 8, title: 'Data Scientist', location: 'Berlin', company: 'AI Lab', skills: ['Python', 'TensorFlow', 'Machine Learning', 'Pandas'], date_posted: '2025-04-20', salary: 68000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 9, title: 'DevOps Engineer', location: 'Amsterdam', company: 'CloudOps', skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'], date_posted: '2025-03-15', salary: 75000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 10, title: 'Frontend Developer', location: 'London', company: 'DesignFlow', skills: ['React', 'Vue.js', 'JavaScript', 'CSS'], date_posted: '2025-02-10', salary: 54000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 11, title: 'Backend Developer', location: 'Amsterdam', company: 'DataStream', skills: ['Node.js', 'Python', 'PostgreSQL', 'Docker'], date_posted: '2025-01-05', salary: 71000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 12, title: 'Data Scientist', location: 'Paris', company: 'AI Solutions', skills: ['Python', 'R', 'SQL', 'TensorFlow'], date_posted: '2024-12-20', salary: 66000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 13, title: 'DevOps Engineer', location: 'Remote', company: 'InfraScale', skills: ['Kubernetes', 'CI/CD', 'AWS', 'GitLab'], date_posted: '2024-11-15', salary: 74000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 14, title: 'Frontend Developer', location: 'Berlin', company: 'CreativeStudio', skills: ['React', 'TypeScript', 'Webpack', 'CSS'], date_posted: '2024-10-10', salary: 56000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 15, title: 'Data Engineer', location: 'Remote', company: 'DataPipeline', skills: ['Python', 'Spark', 'Airflow', 'SQL'], date_posted: '2024-09-05', salary: 69000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 16, title: 'Backend Developer', location: 'Paris', company: 'FinTech Inc', skills: ['Java', 'Spring Boot', 'PostgreSQL', 'REST APIs'], date_posted: '2024-08-20', salary: 73000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 17, title: 'Data Scientist', location: 'Amsterdam', company: 'Analytics Pro', skills: ['Python', 'Pandas', 'Machine Learning', 'Tableau'], date_posted: '2024-07-15', salary: 64000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 18, title: 'DevOps Engineer', location: 'London', company: 'SystemsPro', skills: ['Docker', 'Jenkins', 'AWS', 'Python'], date_posted: '2024-06-10', salary: 76000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 19, title: 'Frontend Developer', location: 'Paris', company: 'WebAgency', skills: ['React', 'JavaScript', 'Redux', 'Sass'], date_posted: '2024-05-10', salary: 56000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 20, title: 'Data Engineer', location: 'London', company: 'Enterprise Data', skills: ['Python', 'SQL', 'AWS', 'Spark'], date_posted: '2024-04-05', salary: 67000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 21, title: 'Backend Developer', location: 'Berlin', company: 'APICompany', skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'], date_posted: '2024-03-01', salary: 73000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 22, title: 'Data Scientist', location: 'Remote', company: 'ML Innovations', skills: ['Python', 'PyTorch', 'SQL', 'Statistics'], date_posted: '2024-02-10', salary: 61000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 23, title: 'DevOps Engineer', location: 'Amsterdam', company: 'CloudNative', skills: ['Kubernetes', 'Prometheus', 'Docker', 'Linux'], date_posted: '2024-01-05', salary: 77000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 24, title: 'Frontend Developer', location: 'Remote', company: 'GlobalTech', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'], date_posted: '2023-12-01', salary: 57000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 25, title: 'Data Engineer', location: 'Paris', company: 'DataHub', skills: ['Python', 'Spark', 'Kafka', 'SQL'], date_posted: '2023-11-10', salary: 68000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 26, title: 'Backend Developer', location: 'Remote', company: 'ScaleUp', skills: ['Go', 'PostgreSQL', 'Docker', 'REST APIs'], date_posted: '2023-10-05', salary: 72000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 27, title: 'Data Scientist', location: 'London', company: 'InsightLabs', skills: ['Python', 'Scikit-learn', 'SQL', 'Jupyter'], date_posted: '2023-09-01', salary: 66000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 28, title: 'DevOps Engineer', location: 'Berlin', company: 'AutoDeploy', skills: ['Jenkins', 'Terraform', 'AWS', 'Bash'], date_posted: '2023-08-10', salary: 78000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' },
  { id: 999, title: 'Data Scientist', location: 'Remote', company: 'Test Corp', skills: ['SQL', 'R', 'Excel'], date_posted: '2025-12-01', salary: 60000, url: 'https://en.wikipedia.org/wiki/Work_(physics)' }, 
];
/**
 * TUM Courses Dataset
 * Source: TUM Campus Online 2025W
 */
/**
 * TUM Courses Dataset
 * Source: TUM Campus Online 2025W (Strictly from user provided list)
 */
export const TUM_COURSES = [
  {
    title: "Dodo Alive! - Resurrecting the Dodo with Robotics and AI",
    semester: "2025 W",
    skills: ["Robotics", "Artificial Intelligence", "Control Systems", "Mechatronics", "Rapid Prototyping", "Locomotion"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950840402"
  },
  {
    title: "Biochemie reaktiver Sauerstoffspezies und freier Radikale",
    semester: "2025 W",
    skills: ["Biochemistry", "Lab Analysis", "Pharmacology", "Molecular Biology", "In-vitro Models"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950877556"
  },
  {
    title: "Instationäre hygrothermische Berechnungsverfahren",
    semester: "2025 W",
    skills: ["Building Physics", "Thermal Simulation", "Energy Efficiency", "Hygrothermal Analysis", "Construction Materials"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950841592"
  },
  {
    title: "A Google-Earth Perspective on Nutrition, Health and Sustainability",
    semester: "2025 W",
    skills: ["Nutrition Science", "Sustainability", "Genomics", "Artificial Intelligence", "Digital Health", "Data Analysis"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950873589"
  },
  {
    title: "A MOOC-supported compact introduction to the Economics of the Agro-food Value Chains",
    semester: "2025 W",
    skills: ["Supply Chain Management", "Market Research", "Economics", "Consumer Behavior", "Innovation Management"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950841675"
  },
  {
    title: "A Practical Course in Numerical Methods for Engineers",
    semester: "2025 W",
    skills: ["MATLAB", "Numerical Methods", "Finite Element Method", "Linear Algebra", "Algorithm Implementation"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950839572"
  },
  {
    title: "Abwehrender Brandschutz",
    semester: "2025 W",
    skills: ["Fire Safety Engineering", "Risk Management", "Crisis Management", "Civil Engineering", "Physics of Fire"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950877506"
  },
  {
    title: "Academic Skills",
    semester: "2025 W",
    skills: ["Academic Writing", "Qualitative Research", "Science and Technology Studies", "Literature Search", "Critical Thinking"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950838232"
  },
  {
    title: "Accounting - Lecture",
    semester: "2025 W",
    skills: ["Financial Accounting", "Controlling", "Balance Sheet Analysis", "Corporate Finance", "Auditing"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950841524"
  },
  {
    title: "Accounting and Value-Based Management",
    semester: "2025 W",
    skills: ["IFRS", "Cost Accounting", "Value-Based Management", "Sustainability Reporting", "Business Ethics"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950876378"
  },
  {
    title: "Active Distribution Grids",
    semester: "2025 W",
    skills: ["Power Systems", "Smart Grids", "MATLAB", "Microgrids", "Control Engineering", "Power Electronics"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950838188"
  },
  {
    title: "Active Learning",
    semester: "2025 W",
    skills: ["Cognitive Science", "Educational Psychology", "Experimental Design", "Research Methodology", "Data Analysis"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950838175"
  },
  {
    title: "Actuarial Risk Theory",
    semester: "2025 W",
    skills: ["Actuarial Science", "R Programming", "Stochastic Processes", "Risk Theory", "Probability Statistics"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950876863"
  },
  {
    title: "Additive Fertigung im Bauwesen - Materialien und Prozesse",
    semester: "2025 W",
    skills: ["3D Concrete Printing", "Material Science", "Additive Manufacturing", "Rheology", "Construction Technology"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950841781"
  },
  {
    title: "Additive Fertigung im Bauwesen 1",
    semester: "2025 W",
    skills: ["Robotics", "Path Planning", "3D Printing", "Digital Fabrication", "Experimental Testing"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950876621"
  },
  {
    title: "Additive Fertigung in der Gießereitechnik",
    semester: "2025 W",
    skills: ["Metal Casting", "CAD", "Additive Manufacturing", "Simulation", "Production Engineering"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950840481"
  },
  {
    title: "Advanced Algorithms",
    semester: "2025 W",
    skills: ["Algorithm Design", "Computational Complexity", "Optimization", "Linear Programming", "Data Structures"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950841487"
  },
  {
    title: "Advanced Analysis of Variance Procedures",
    semester: "2025 W",
    skills: ["R Programming", "Python", "ANOVA", "Statistical Analysis", "Data Science"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950875407"
  },
  {
    title: "Advanced Concepts of Programming Languages",
    semester: "2025 W",
    skills: ["Compiler Construction", "Concurrent Programming", "Software Engineering", "Meta-programming", "System Architecture"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950841795"
  },
  {
    title: "Advanced Control - Lecture",
    semester: "2025 W",
    skills: ["Control Theory", "Linear Systems", "LQR Control", "State Space Models", "MATLAB"],
    url: "https://campus.tum.de/tumonline/ee/ui/ca2/app/desktop/#/slc.tm.cp/student/courses/950837364"
  }
];