const fs = require('fs');
const lines = fs.readFileSync('src/App.js', 'utf8').split('\n');

let stack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Very simple tag matcher (ignoring attributes for now)
    const matches = line.match(/<div|<\/div>/g) || [];
    for (const tag of matches) {
        if (tag === '<div') {
            stack.push(i + 1);
        } else {
            if (stack.length === 0) {
                console.log(`L${i + 1}: Extra </div>`);
            } else {
                stack.pop();
            }
        }
    }
}
console.log('Final Div Stack:', stack);

let bStack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/\{|\}/g) || [];
    for (const m of matches) {
        if (m === '{') bStack.push(i + 1);
        else {
            if (bStack.length === 0) console.log(`L${i + 1}: Extra }`);
            else bStack.pop();
        }
    }
}
console.log('Final Brace Stack size:', bStack.length);

let pStack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/\(|\)/g) || [];
    for (const m of matches) {
        if (m === '(') pStack.push(i + 1);
        else {
            if (pStack.length === 0) console.log(`L${i + 1}: Extra )`);
            else pStack.pop();
        }
    }
}
console.log('Final Paren Stack size:', pStack.length);
