
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const pages = ['landing', 'dashboard', 'explorer', 'watchdog', 'forecast', 'auditor', 'chain', 'deepscan', 'adp', 'api'];
pages.forEach(p => {
  if (html.includes(id= + String.fromCharCode(34) + page- + p + String.fromCharCode(34))) {
    console.log(FOUND: page- + p);
  } else {
    console.log(MISSING: page- + p);
  }
});

