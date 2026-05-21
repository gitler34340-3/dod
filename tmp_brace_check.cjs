const fs = require('fs');
const code = fs.readFileSync('src/app/components/ImprovedScheduleScreen.tsx','utf8');
const stack=[];
const pairs={'{':'}','[':']','(':')'};
for(let i=0;i<code.length;i++){
  const ch=code[i];
  if(ch==='"' || ch==="'"||ch==='`'){
    const quote=ch; i++;
    while(i<code.length && code[i]!==quote){
      if(code[i]==='\\') i++;
      i++;
    }
    continue;
  }
  if(ch==='/' && code[i+1]==='/'){
    while(i<code.length && code[i]!=='\n') i++;
    continue;
  }
  if(ch==='/' && code[i+1]==='*'){
    i+=2;
    while(i<code.length && !(code[i]==='*'&&code[i+1]==='/')) i++;
    i++;
    continue;
  }
  if(pairs[ch]) stack.push({ch,idx:i});
  else if(Object.values(pairs).includes(ch)){
    const last=stack.pop();
    if(!last||pairs[last.ch]!==ch){
      console.log('mismatch', ch, 'at', i);
      process.exit(1);
    }
  }
}
if(stack.length) {
  console.log('unclosed', stack[stack.length-1]);
  process.exit(1);
}
console.log('braces match');
