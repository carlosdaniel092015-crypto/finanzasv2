const fs = require('fs');
const content = fs.readFileSync('src/App.js', 'utf8');

let results = [];
let stack = 0;
for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '?') {
        // Skip ternary symbols in strings
        stack++;
        results.push({ type: '?', pos: i, line: content.substring(0, i).split('\n').length });
    } else if (char === ':') {
        if (stack > 0) {
            stack--;
            results.push({ type: ':', pos: i, line: content.substring(0, i).split('\n').length });
        }
    }
}

console.log('Unclosed ?: ', stack);
if (stack > 0) {
    // This is naive because colons are used for many things.
}

// Check lines around 2314-2315
const lines = content.split('\n');
console.log('L2314:', lines[2313]);
console.log('L2315:', lines[2314]);
console.log('L2316:', lines[2315]);
