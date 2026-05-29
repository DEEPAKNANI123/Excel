const fs = require('fs');

const data = [
  {
    "personId": "400022",
    "userId": "400437",
    "firstName": "Muhamad Rikaz",
    "lastName": "Muhammad Lebbe",
    "email": "mrikaz@isa.ae",
    "jobTitle": "Senior Manager - Software Engineering",
    "department": "20000057",
    "managerId": "400116"
  },
  {
    "personId": "400003",
    "userId": "400003",
    "firstName": "Pradeep Dilruk Sri",
    "lastName": "Karunanayaka Rankoth Pedi Durayalage",
    "email": "pkarunanayake@isa.ae",
    "jobTitle": "Senior Software Architect",
    "department": "20000057",
    "managerId": "400437"
  },
  {
    "personId": "400023",
    "userId": "400023",
    "firstName": "Vidula Hasaranga",
    "lastName": "Malimbada Liyanage",
    "email": "vhasaranga@isa.ae",
    "jobTitle": "Senior Software Architect",
    "department": "20000057",
    "managerId": "400437"
  },
  {
    "personId": "400030",
    "userId": "400030",
    "firstName": "GONAWALA RALALAGE",
    "lastName": "BANDARA",
    "email": "bbandara@isa.ae",
    "jobTitle": "Senior Tech Lead",
    "department": "20000057",
    "managerId": "400003"
  },
  {
    "personId": "400055",
    "userId": "400055",
    "firstName": "Supun",
    "lastName": "Mihiranga",
    "email": "smihiranga@isa.ae",
    "jobTitle": "Tech Lead",
    "department": "20000057",
    "managerId": "400003"
  },
  {
    "personId": "400099",
    "userId": "400099",
    "firstName": "Saarrah",
    "lastName": "Isthikar",
    "email": "sisthikar@isa.ae",
    "jobTitle": "Associate Tech Lead",
    "department": "20000057",
    "managerId": "400003"
  },
  {
    "personId": "400081",
    "userId": "400081",
    "firstName": "Shaharsad",
    "lastName": "Salam",
    "email": "sshaharsad@isa.ae",
    "jobTitle": "Principal Product Manager",
    "department": "20000059",
    "managerId": "400116"
  },
  {
    "personId": "400042",
    "userId": "400042",
    "firstName": "Remya",
    "lastName": "Vinod",
    "email": "rvinod@isa.ae",
    "jobTitle": "Senior Quality Analyst Lead",
    "department": "20000057",
    "managerId": "400081"
  },
  {
    "personId": "400064",
    "userId": "400064",
    "firstName": "Sahan Chandula",
    "lastName": "Bandara",
    "email": "cbandara@isa.ae",
    "jobTitle": "UX Architect",
    "department": "20000059",
    "managerId": "400081"
  },
  {
    "personId": "400089",
    "userId": "400089",
    "firstName": "Praveen",
    "lastName": "Kumar Prabhakaran",
    "email": "prkumar@isa.ae",
    "jobTitle": "Quality Analyst Lead",
    "department": "20000057",
    "managerId": "400081"
  }
];

// Helper to convert short ID to UUID
function toUUID(id) {
  if (!id) return null;
  return \`00000000-0000-0000-0000-\${id.toString().padStart(12, '0')}\`;
}

// Get unique departments
const deps = [...new Set(data.map(d => d.department))];

let sql = \`-- ==========================================
-- 1. SEED DEPARTMENTS
-- ==========================================

\`;

sql += \`INSERT INTO departments (id, name) VALUES \n\`;
deps.forEach((d, index) => {
  sql += \`  ('\${toUUID(d)}', 'Department \${d}')\${index === deps.length - 1 ? ';' : ','}\n\`;
});

sql += \`\n\n-- ==========================================
-- 2. SEED PROFILES (Users)
-- Note: Requires RLS disabled or FK constraints temporarily removed if users aren't in auth.users
-- ==========================================

INSERT INTO profiles (id, employee_id, first_name, last_name, job_title, department_id, manager_id, role) VALUES \n\`;

data.forEach((d, index) => {
  const isManager = data.some(kid => kid.managerId === d.userId);
  const role = isManager ? 'manager' : 'employee';
  
  sql += \`  (
    '\${toUUID(d.userId)}',
    '\${d.userId}',
    '\${d.firstName.replace(/'/g, "''")}',
    '\${d.lastName.replace(/'/g, "''")}',
    '\${d.jobTitle.replace(/'/g, "''")}',
    '\${toUUID(d.department)}',
    '\${toUUID(d.managerId)}',
    '\${role}'
  )\${index === data.length - 1 ? ';' : ','}\n\`;
});

fs.writeFileSync('generated_seed.sql', sql);
console.log('Done');
