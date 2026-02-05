const fs = require('fs');
const lines = fs.readFileSync('src/App.js', 'utf8').split('\n');

let stack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const divs = line.match(/<div|<\/div>/g) || [];
    for (const tag of divs) {
        if (tag === '<div') {
            stack.push(i + 1);
        } else {
            if (stack.length === 0) {
                console.log(`Extra </div> at line ${i + 1}`);
            } else {
                stack.pop();
            }
        }
    }
}

if (stack.length > 0) {
    console.log(`Unclosed <div> tags from lines: ${stack.join(', ')}`);
} else {
    console.log('Divs are balanced!');
}

let braceStack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/\{|\}/g) || [];
    for (const m of matches) {
        if (m === '{') braceStack.push(i + 1);
        else {
            if (braceStack.length === 0) console.log(`Extra } at line ${i + 1}`);
            else braceStack.pop();
        }
    }
}
if (braceStack.length > 0) console.log(`Unclosed { from lines: ${braceStack.join(', ')}`);

let parenStack = [];
for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/\(|\)/g) || [];
    for (const m of matches) {
        if (m === '(') parenStack.push(i + 1);
        else {
            if (parenStack.length === 0) console.log(`Extra ) at line ${i + 1}`);
            else parenStack.pop();
        }
    }
}
if (parenStack.length > 0) console.log(`Unclosed ( from lines: ${parenStack.join(', ')}`);
