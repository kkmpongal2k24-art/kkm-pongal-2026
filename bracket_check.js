const fs = require('fs');

const content = fs.readFileSync('/Users/sketchbrahma/Documents/personal-belongs/pongal-2026/src/components/Games.jsx', 'utf8');
const lines = content.split('\n');

let openParen = 0;
let openBrace = 0;
let openSquare = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '(') openParen++;
    else if (char === ')') openParen--;
    else if (char === '{') openBrace++;
    else if (char === '}') openBrace--;
    else if (char === '[') openSquare++;
    else if (char === ']') openSquare--;
  }

  // Show lines where counts become negative (indicating mismatch)
  if (openParen < 0 || openBrace < 0 || openSquare < 0) {
    console.log(`Line ${i + 1}: () = ${openParen}, {} = ${openBrace}, [] = ${openSquare}`);
    console.log(`Content: ${line}`);
  }
}

console.log(`Final counts:`);
console.log(`Parentheses: ${openParen}`);
console.log(`Braces: ${openBrace}`);
console.log(`Squares: ${openSquare}`);