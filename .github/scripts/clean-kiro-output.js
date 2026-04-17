// Cleans Kiro CLI output for use in GitHub PR comments/issues.
// Strips ANSI escape codes, terminal control sequences, spinner characters,
// and tool invocation noise — leaving only the markdown review content.

const fs = require('fs');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node clean-kiro-output.js <input> <output>');
  process.exit(1);
}

let text = fs.readFileSync(inputFile, 'utf8');

// 1. Strip ALL ANSI/VT100 escape sequences (colors, cursor, modes, etc.)
//    Covers: ESC[...m, ESC[?25l, ESC[?25h, ESC[nA/B/C/D, ESC(B, etc.
text = text.replace(/\x1b\[[\x20-\x3f]*[\x40-\x7e]/g, '');  // CSI sequences
text = text.replace(/\x1b[()][A-Z0-9]/g, '');                 // Character set selection
text = text.replace(/\x1b[\x20-\x2f]*[\x30-\x7e]/g, '');     // Other ESC sequences
text = text.replace(/\x9b[\x20-\x3f]*[\x40-\x7e]/g, '');     // 8-bit CSI

// 2. Strip replacement character (from malformed escape sequences)
text = text.replace(/\uFFFD/g, '');

// 3. Strip spinner/progress characters
text = text.replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '');

// 4. Strip unicode box-drawing and decorative characters
text = text.replace(/[━─│┌┐└┘├┤┬┴┼↱⋮]/g, '');

// 5. Remove Kiro CLI tool invocation lines
const noisePatterns = [
  /^.*\(using tool:.*\).*$/gm,
  /^.*Loading\.\.\..*$/gm,
  /^Batch fs_read operation.*$/gm,
  /^↱ Operation \d+:.*$/gm,
  /^✓ Successfully read.*$/gm,
  /^Completed in [\d.]+s$/gm,
  /^- Summary: \d+ operations.*$/gm,
  /^- Completed in.*$/gm,
  /^Reading (file|directory):.*$/gm,
  /^Invoking \d+ subagents.*$/gm,
  /^\d+\.\s+kiro_default:.*$/gm,
  /^Search codebase map.*$/gm,
  /^\[CodebaseMap.*$/gm,
  /^Learn more at https:\/\/kiro\.dev.*$/gm,
];

for (const pattern of noisePatterns) {
  text = text.replace(pattern, '');
}

// 6. Remove lines that are just ">" (Kiro thinking indicator)
text = text.replace(/^>\s*$/gm, '');

// 7. Collapse 3+ consecutive newlines into 2
text = text.replace(/\n{3,}/g, '\n\n');

// 8. Trim leading/trailing whitespace
text = text.trim();

fs.writeFileSync(outputFile, text, 'utf8');
console.log(`Cleaned ${inputFile} -> ${outputFile} (${text.length} chars)`);
