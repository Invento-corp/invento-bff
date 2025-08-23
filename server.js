// For local development only (not used on Lambda)
const http = require('http');
const app = require('./app');

const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`Local server running at http://localhost:${port}`);
});