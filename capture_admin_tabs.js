const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(__dirname, 'screenshots');

let adminHtml = fs.readFileSync('admin.html', 'utf8');

// Inject pre-auth at the top of head
const preAuth = '<script>localStorage.setItem("alhijr_auth_token", "token-demo"); localStorage.setItem("alhijr_user", JSON.stringify({id:"usr_admin_01", username:"admin", full_name:"ماجد محسن الشهري", role:"ADMIN"}));</script>';
adminHtml = adminHtml.replace('<head>', '<head>' + preAuth);

const tabs = [
  { id: 'dashboard', name: '07_admin_dashboard' },
  { id: 'appointments', name: '08_admin_appointments' },
  { id: 'bookings', name: '09_admin_bookings' },
  { id: 'reports', name: '10_admin_reports' },
  { id: 'users', name: '11_admin_users' }
];

tabs.forEach(t => {
  let tabHtml = adminHtml;
  const activateScript = `<script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        const item = document.querySelector('[data-tab="${t.id}"]');
        if (item) item.click();
      }, 500);
    });
  </script>`;
  tabHtml = tabHtml.replace('</body>', activateScript + '</body>');
  const tempFile = path.join(__dirname, `temp_admin_${t.id}.html`);
  fs.writeFileSync(tempFile, tabHtml, 'utf8');

  const outFile = path.join(outputDir, `${t.name}.png`);
  try {
    execSync(`"${chromePath}" --headless --disable-gpu --virtual-time-budget=2500 --screenshot="${outFile}" --window-size=1280,820 "file:///${tempFile.replace(/\\/g, '/')}"`, { stdio: 'ignore' });
    console.log(`Captured ${t.name}: ${fs.statSync(outFile).size} bytes`);
  } catch (e) {
    console.error(`Error capturing ${t.name}:`, e.message);
  }
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
});

console.log('Admin tabs captured successfully!');
