const fs = require('fs');
const content = fs.readFileSync('src/App.js', 'utf8');

const divOpen = (content.match(/<div/g) || []).length;
const divClose = (content.match(/<\/div>/g) || []).length;
const braceOpen = (content.match(/\{/g) || []).length;
const braceClose = (content.match(/\}/g) || []).length;
const parenOpen = (content.match(/\(/g) || []).length;
const parenClose = (content.match(/\)/g) || []).length;
const ques = (content.match(/\?/g) || []).length;
const colons = (content.match(/:/g) || []).length;

console.log(`Divs: ${divOpen} open, ${divClose} close (Diff: ${divOpen - divClose})`);
console.log(`Braces: ${braceOpen} open, ${braceClose} close (Diff: ${braceOpen - braceClose})`);
console.log(`Parens: ${parenOpen} open, ${parenClose} close (Diff: ${parenOpen - parenClose})`);
console.log(`Ternary: ${ques} ?, ${colons} : (Diff: ${ques - colons})`);
