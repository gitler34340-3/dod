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
      console.log('mismatch', ch, 'at', i, 'expected', last?pairs[last.ch]:null);
      process.exit(1);
    }
  }
}
console.log('stack length', stack.length);
if(stack.length) {
  const top = stack[stack.length-1];
  // compute line/col
  const substr = code.slice(0, top.idx);
  const line = substr.split(/\r?\n/).length;
  const col = substr.split(/\r?\n/).pop().length + 1;
  console.log('top unclosed at', line, col, 'char', top.ch);
}
