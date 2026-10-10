const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const outputDir = path.join(__dirname, 'screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const pages = [
  { name: '01_home', file: 'index.html', title: 'الصفحة الرئيسية' },
  { name: '02_book', file: 'book.html', title: 'بوابة الحجز والمواعيد' },
  { name: '03_ticket', file: 'ticket.html?ref=HJ-2026-1001&token=HJ-V1-39f432eca0560844-e5d85021702d69ca&name=%D9%85%D8%AD%D9%85%D8%AF%20%D8%B9%D8%A8%D8%AF%D8%A7%D9%84%D9%84%D9%87%20%D8%A8%D8%A7%D9%88%D8%B2%D9%8A%D8%B1&id=1088765432&phone=0555123456&date=2026-10-10&time=22:00-00:00&p=2&st=CONFIRMED', title: 'التذكرة وتصريح الدخول' },
  { name: '04_inquiry', file: 'inquiry.html', title: 'الاستعلام عن الحجز' },
  { name: '05_scanner', file: 'scanner.html', title: 'نظام التحقق ومسح الباركود الميداني' },
  { name: '06_login', file: 'login.html', title: 'تسجيل دخول الإدارة والمشرفين' },
  { name: '07_admin_dashboard', file: 'admin.html', title: 'لوحة التحكم والمؤشرات' }
];

console.log('Taking screenshots of pages...');

for (const p of pages) {
  const outFile = path.join(outputDir, `${p.name}.png`);
  const targetUrl = 'file:///' + path.join(__dirname, p.file).replace(/\\/g, '/');
  console.log(`Capturing: ${p.title} -> ${outFile}`);
  try {
    execSync(`"${chromePath}" --headless --disable-gpu --screenshot="${outFile}" --window-size=1280,820 "${targetUrl}"`, { stdio: 'ignore' });
    if (fs.existsSync(outFile)) {
      console.log(`✓ Saved: ${p.name}.png (${fs.statSync(outFile).size} bytes)`);
    } else {
      console.warn(`✗ Not saved: ${p.name}.png`);
    }
  } catch (err) {
    console.error(`Error on ${p.name}:`, err.message);
  }
}

console.log('All screenshots completed.');
