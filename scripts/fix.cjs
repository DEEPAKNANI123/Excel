const fs = require('fs');
let c = fs.readFileSync('src/App.jsx', 'utf8');
c = c.replace(/\\n\\n\/\/ ── HR ──/g, '\n\n// ── HR ──');
fs.writeFileSync('src/App.jsx', c);
