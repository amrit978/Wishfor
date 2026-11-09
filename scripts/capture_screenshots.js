const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outDir = path.join(__dirname, '..', 'screenshots');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const resolutions = [
  { name: '1920', width: 1920, height: 1080 },
  { name: '1440', width: 1440, height: 900 },
  { name: '768', width: 768, height: 1024 },
  { name: '375', width: 375, height: 812 },
];

const routes = [
  { name: 'home', path: '/' },
  { name: 'problems', path: '/problems' },
  { name: 'share', path: '/share' },
  { name: 'my_space', path: '/my-space' },
  { name: 'about', path: '/about' },
  { name: 'guidelines', path: '/guidelines' },
  { name: 'auth', path: '/auth' },
];

function waitForServer(port, timeoutMs = 20000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      const req = http.get(`http://localhost:${port}/`, (res) => {
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error('Server did not start in time'));
        } else {
          setTimeout(check, 500);
        }
      });
    };
    check();
  });
}

async function run() {
  const targetPort = 3000;
  console.log(`Connecting to server on port ${targetPort}...`);

  for (const route of routes) {
    for (const res of resolutions) {
      const outFile = path.join(outDir, `${route.name}_${res.name}.png`);
      const url = `http://localhost:${targetPort}${route.path}`;
      console.log(`Capturing ${route.name} at ${res.width}x${res.height}...`);
      
      const cmd = `"${chromePath}" --headless=new --disable-gpu --virtual-time-budget=2000 --window-size=${res.width},${res.height} --screenshot="${outFile}" "${url}"`;
      try {
        execSync(cmd, { stdio: 'ignore' });
        if (fs.existsSync(outFile)) {
          const stats = fs.statSync(outFile);
          console.log(`  ✓ Saved ${outFile} (${Math.round(stats.size / 1024)} KB)`);
        } else {
          console.warn(`  ✗ Failed to save ${outFile}`);
        }
      } catch (e) {
        console.error(`  Error running chrome for ${route.name}_${res.name}:`, e.message);
      }
    }
  }

  console.log('All screenshots captured successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
