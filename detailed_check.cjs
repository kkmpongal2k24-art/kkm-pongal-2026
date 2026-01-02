const fs = require('fs');

const content = fs.readFileSync('/Users/sketchbrahma/Documents/personal-belongs/pongal-2026/src/components/Games.jsx', 'utf8');
const lines = content.split('\n');

// Look at lines 884-888 in detail
for (let i = 883; i < Math.min(889, lines.length); i++) {
  const line = lines[i];
  console.log(`Line ${i + 1}: "${line}"`);

  // Show character codes for special characters
  if (line.includes('}') || line.includes(')') || line.includes('export')) {
    console.log(`  Chars: ${line.split('').map(c => c + ' (' + c.charCodeAt(0) + ')').join(', ')}`);
  }
}

// Check if there's actually content after the function closure
const functionEndIndex = content.lastIndexOf('}');
const exportIndex = content.indexOf('export default Games');
console.log(`\nFunction ends at character: ${functionEndIndex}`);
console.log(`Export starts at character: ${exportIndex}`);
console.log(`Content between function end and export:`);
console.log(`"${content.substring(functionEndIndex, exportIndex)}"`);