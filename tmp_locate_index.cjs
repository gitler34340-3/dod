const fs = require('fs');
const code = fs.readFileSync('src/app/components/ImprovedScheduleScreen.tsx','utf8');
const idx = 1183;
let line=1,col=1;
for(let i=0;i<idx && i<code.length;i++){
  if(code[i]==='\n'){line++;col=1;} else col++;
}
console.log('line',line,'col',col,'char',code[idx]);
console.log(code.slice(Math.max(0,idx-80), idx+80));
