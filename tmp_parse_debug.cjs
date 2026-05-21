const fs = require('fs');
const parser = require('@babel/parser');
const code = fs.readFileSync('src/app/components/ImprovedScheduleScreen.tsx','utf8');
const ast = parser.parse(code, {sourceType:'module', plugins:['typescript','jsx'], errorRecovery:true, tokens:true});
console.log('errors', ast.errors.length);
if(ast.errors.length) {
  ast.errors.forEach(e=>{
    console.log('---');
    console.log(e.message);
    console.log('loc', e.loc);
  });
}
console.log('tokens around error:');
const pos = 44727; // from earlier error
const tokens = ast.tokens.filter(t=>t.start > pos-100 && t.end < pos+100);
console.log(tokens.map(t=>({type:t.type.label, value:t.value, start:t.start, end:t.end})));
