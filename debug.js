
const http = require('http');
http.get('http://localhost:8000/index.html', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    // Check missing ids
    const matches = data.match(/id="([^"]+)"/g);
    console.log('HTML loaded, length:', data.length);
  });
}).on('error', (err) => { console.log('Error: ' + err.message); });

