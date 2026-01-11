t /**
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
  // === Fresh postings (last ~3 months) ===
  { id: 29, title: 'Data Scientist', location: 'London', company: 'InsightWorks', skills: ['Python', 'SQL', 'Machine Learning', 'Pandas'], date_posted: '2025-12-05', salary: 69000 },
  { id: 30, title: 'Backend Developer', location: 'Remote', company: 'API Forge', skills: ['Node.js', 'Docker', 'PostgreSQL', 'AWS'], date_posted: '2025-11-28', salary: 74000 },
  { id: 31, title: 'Frontend Developer', location: 'Berlin', company: 'UI Studio', skills: ['React', 'TypeScript', 'CSS', 'Vite'], date_posted: '2025-11-20', salary: 58000 },
  { id: 32, title: 'Data Engineer', location: 'Remote', company: 'StreamLab', skills: ['Python', 'SQL', 'Airflow', 'Spark'], date_posted: '2025-11-12', salary: 72000 },
  { id: 33, title: 'DevOps Engineer', location: 'London', company: 'CloudGuard', skills: ['Kubernetes', 'Docker', 'Terraform', 'AWS'], date_posted: '2025-11-02', salary: 79000 },
  { id: 34, title: 'Backend Developer', location: 'Milan', company: 'FinEdge', skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'], date_posted: '2025-10-25', salary: 71000 },
  { id: 35, title: 'Frontend Developer', location: 'Remote', company: 'PixelSoft', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'], date_posted: '2025-10-12', salary: 56000 },
  { id: 36, title: 'Data Scientist', location: 'Berlin', company: 'ModelWorks', skills: ['Python', 'TensorFlow', 'SQL', 'Statistics'], date_posted: '2025-09-18', salary: 67000 },
  // === Existing dataset ===
  { id: 1, title: 'Data Scientist', location: 'London', company: 'TechCorp', skills: ['Python', 'Pandas', 'SQL', 'Machine Learning'], date_posted: '2025-11-15', salary: 65000 },
  { id: 2, title: 'Data Scientist', location: 'Remote', company: 'DataFlow Inc', skills: ['Python', 'SQL', 'Statistics'], date_posted: '2025-10-10', salary: 60000 },
  { id: 3, title: 'Backend Developer', location: 'Remote', company: 'CloudSys', skills: ['Python', 'Docker', 'AWS', 'REST APIs'], date_posted: '2025-09-05', salary: 70000 },
  { id: 4, title: 'Frontend Developer', location: 'Milan', company: 'WebStudio', skills: ['React', 'JavaScript', 'CSS', 'TypeScript'], date_posted: '2025-08-20', salary: 55000 },
  { id: 5, title: 'Data Engineer', location: 'Berlin', company: 'BigData Solutions', skills: ['Python', 'SQL', 'AWS', 'Spark'], date_posted: '2025-07-15', salary: 67000 },
  { id: 6, title: 'Backend Developer', location: 'London', company: 'Enterprise Systems', skills: ['Java', 'Docker', 'Kubernetes', 'SQL'], date_posted: '2025-06-10', salary: 72000 },
  { id: 7, title: 'Frontend Developer', location: 'Remote', company: 'StartupX', skills: ['React', 'TypeScript', 'Next.js'], date_posted: '2025-05-05', salary: 53000 },
  { id: 8, title: 'Data Scientist', location: 'Berlin', company: 'AI Lab', skills: ['Python', 'TensorFlow', 'Machine Learning', 'Pandas'], date_posted: '2025-04-20', salary: 68000 },
  { id: 9, title: 'DevOps Engineer', location: 'Amsterdam', company: 'CloudOps', skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform'], date_posted: '2025-03-15', salary: 75000 },
  { id: 10, title: 'Frontend Developer', location: 'London', company: 'DesignFlow', skills: ['React', 'Vue.js', 'JavaScript', 'CSS'], date_posted: '2025-02-10', salary: 54000 },
  { id: 11, title: 'Backend Developer', location: 'Amsterdam', company: 'DataStream', skills: ['Node.js', 'Python', 'PostgreSQL', 'Docker'], date_posted: '2025-01-05', salary: 71000 },
  { id: 12, title: 'Data Scientist', location: 'Paris', company: 'AI Solutions', skills: ['Python', 'R', 'SQL', 'TensorFlow'], date_posted: '2024-12-20', salary: 66000 },
  { id: 13, title: 'DevOps Engineer', location: 'Remote', company: 'InfraScale', skills: ['Kubernetes', 'CI/CD', 'AWS', 'GitLab'], date_posted: '2024-11-15', salary: 74000 },
  { id: 14, title: 'Frontend Developer', location: 'Berlin', company: 'CreativeStudio', skills: ['React', 'TypeScript', 'Webpack', 'CSS'], date_posted: '2024-10-10', salary: 56000 },
  { id: 15, title: 'Data Engineer', location: 'Remote', company: 'DataPipeline', skills: ['Python', 'Spark', 'Airflow', 'SQL'], date_posted: '2024-09-05', salary: 69000 },
  { id: 16, title: 'Backend Developer', location: 'Paris', company: 'FinTech Inc', skills: ['Java', 'Spring Boot', 'PostgreSQL', 'REST APIs'], date_posted: '2024-08-20', salary: 73000 },
  { id: 17, title: 'Data Scientist', location: 'Amsterdam', company: 'Analytics Pro', skills: ['Python', 'Pandas', 'Machine Learning', 'Tableau'], date_posted: '2024-07-15', salary: 64000 },
  { id: 18, title: 'DevOps Engineer', location: 'London', company: 'SystemsPro', skills: ['Docker', 'Jenkins', 'AWS', 'Python'], date_posted: '2024-06-10', salary: 76000 },
  { id: 19, title: 'Frontend Developer', location: 'Paris', company: 'WebAgency', skills: ['React', 'JavaScript', 'Redux', 'Sass'], date_posted: '2024-05-10', salary: 56000 },
  { id: 20, title: 'Data Engineer', location: 'London', company: 'Enterprise Data', skills: ['Python', 'SQL', 'AWS', 'Spark'], date_posted: '2024-04-05', salary: 67000 },
  { id: 21, title: 'Backend Developer', location: 'Berlin', company: 'APICompany', skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis'], date_posted: '2024-03-01', salary: 73000 },
  { id: 22, title: 'Data Scientist', location: 'Remote', company: 'ML Innovations', skills: ['Python', 'PyTorch', 'SQL', 'Statistics'], date_posted: '2024-02-10', salary: 61000 },
  { id: 23, title: 'DevOps Engineer', location: 'Amsterdam', company: 'CloudNative', skills: ['Kubernetes', 'Prometheus', 'Docker', 'Linux'], date_posted: '2024-01-05', salary: 77000 },
  { id: 24, title: 'Frontend Developer', location: 'Remote', company: 'GlobalTech', skills: ['React', 'Next.js', 'TypeScript', 'Tailwind'], date_posted: '2023-12-01', salary: 57000 },
  { id: 25, title: 'Data Engineer', location: 'Paris', company: 'DataHub', skills: ['Python', 'Spark', 'Kafka', 'SQL'], date_posted: '2023-11-10', salary: 68000 },
  { id: 26, title: 'Backend Developer', location: 'Remote', company: 'ScaleUp', skills: ['Go', 'PostgreSQL', 'Docker', 'REST APIs'], date_posted: '2023-10-05', salary: 72000 },
  { id: 27, title: 'Data Scientist', location: 'London', company: 'InsightLabs', skills: ['Python', 'Scikit-learn', 'SQL', 'Jupyter'], date_posted: '2023-09-01', salary: 66000 },
  { id: 28, title: 'DevOps Engineer', location: 'Berlin', company: 'AutoDeploy', skills: ['Jenkins', 'Terraform', 'AWS', 'Bash'], date_posted: '2023-08-10', salary: 78000 },
  { id: 999, title: 'Data Scientist',  location: 'Remote', company: 'Test Corp',  skills: ['SQL', 'R', 'Excel'], date_posted: '2023-08-10', salary: 78000 }, // No Python here! date_posted: '2025-12-01', salary: 60000 
  
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