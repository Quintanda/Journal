import http from 'http';
import fs from 'fs';
import path from 'path'

const server = http.createServer((req, res) => {
  // Serve index.html
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile(path.join('index.html'), (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }
      
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(data);
    });
  }
  // Serve styles.css
  else if (req.url === '/styles.css') {
    fs.readFile(path.join('styles.css'), (err, data) => {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading styles.css');
      }
      
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.end(data);
    });
  }
  // Handle other requests (e.g., 404 Not Found)
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}/`);
});

