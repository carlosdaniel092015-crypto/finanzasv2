const fs = require('fs');
const content = fs.readFileSync('src/App.js', 'utf8');
const lines = content.split('\n');

function checkRange(start, end, name) {
    let stack = 0;
    for (let i = start - 1; i < end; i++) {
        const line = lines[i] || '';
        const matches = line.match(/<div|<\/div>/g) || [];
        for (const m of matches) {
            if (m === '<div') stack++;
            else stack--;
        }
    }
    console.log(`${name}: ${stack}`);
}

checkRange(1641, 1961, 'Finanzas');
checkRange(1961, 2029, 'Ahorros');
checkRange(2029, 2112, 'Recordatorios');
checkRange(2112, 2215, 'Empresa');
checkRange(2215, 2314, 'Categorias');
checkRange(2317, 2384, 'Notifications');
checkRange(2388, 2436, 'BottomNav');
checkRange(2442, 2692, 'AddModal');
checkRange(2699, 2707, 'OCROverlay');

let total = 0;
const matches = content.match(/<div|<\/div>/g) || [];
for (const m of matches) { if (m === '<div') total++; else total--; }
console.log('Total diff:', total);
