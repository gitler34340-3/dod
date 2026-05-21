const fs = require('fs');
const lines = fs.readFileSync('src/app/components/ImprovedScheduleScreen.tsx', 'utf8').split(/\r?\n/);
const start = 1145;
const end = 1170;
for (let i = start; i <= end; i++) {
  const line = lines[i-1] ?? '';
  console.log(`${i.toString().padStart(4)}| ${line}`);
}
