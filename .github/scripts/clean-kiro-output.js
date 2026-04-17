// Cleans Kiro CLI output for use in GitHub PR comments/issues.
//
// Strategy: Instead of trying to strip every possible noise pattern,
// we first strip ANSI codes, then find where the actual markdown content
// begins (first markdown heading, table, or list) and discard everything before it.
// This is resilient to new CLI output formats.

const fs = require('fs');

const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.error('Usage: node clean-kiro-output.js <input> <output>');
  process.exit(1);
}

let text = fs.readFileSync(inputFile, 'utf8');

// ── Phase 1: Strip all terminal escape sequences ──

// CSI sequences: ESC[ ... (letter)  — covers colors, cursor, modes
text = text.replace(/\x1b\[[\x20-\x3f]*[\x40-\x7e]/g, '');
// Character set selection: ESC( or ESC)
text = text.replace(/\x1b[()][A-Z0-9]/g, '');
// Other ESC sequences
text = text.replace(/\x1b[\x20-\x2f]*[\x30-\x7e]/g, '');
// 8-bit CSI
text = text.replace(/\x9b[\x20-\x3f]*[\x40-\x7e]/g, '');
// Replacement character from malformed sequences
text = text.replace(/\uFFFD/g, '');
// Spinner characters
text = text.replace(/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/g, '');
// Box-drawing characters
text = text.replace(/[━─│┌┐└┘├┤┬┴┼↱⋮]/g, '');

// ── Phase 2: Find where the real content starts ──
//
// Kiro CLI outputs tool invocation logs before the actual review/summary.
// The actual content always starts with markdown structure:
//   - A heading (## or #)
//   - A table row (| ... |)
//   - A bold marker (**...**)
//   - A numbered list (1. **...)
//
// We split into lines, find the first line that looks like markdown content,
// and discard everything before it.

const lines = text.split('\n');

// Patterns that indicate the start of actual markdown content
const contentStartPatterns = [
  /^#{1,6}\s+/,           // Markdown heading
  /^\|.*\|/,              // Table row
  /^\*\*[^*]+\*\*/,       // Bold text at start of line
  /^\d+\.\s+\*\*/,        // Numbered list with bold
  /^[-*]\s+\*\*/,         // Bullet list with bold
  /^>\s*[⚠🔴🟠🟡🔵⚪📋🤖🔍📚]/, // Blockquote with emoji (common in reviews)
];

let contentStartIndex = -1;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (contentStartPatterns.some(p => p.test(line))) {
    contentStartIndex = i;
    break;
  }
}

// If we found a content start, slice from there; otherwise keep everything
// (fallback — better to show noisy output than nothing)
if (contentStartIndex >= 0) {
  text = lines.slice(contentStartIndex).join('\n');
} else {
  text = lines.join('\n');
}

// ── Phase 3: Clean up any remaining noise lines within the content ──

const noisePatterns = [
  /^.*\(using tool:.*\).*$/gm,
  /^.*Loading\.\.\..*$/gm,
  /^Batch fs_read operation.*$/gm,
  /^Operation \d+:.*$/gm,
  /^✓ Successfully read.*$/gm,
  /^Completed in [\d.]+s.*$/gm,
  /^- Summary: \d+ operations.*$/gm,
  /^- Completed in.*$/gm,
  /^Reading (file|directory):.*$/gm,
  /^Invoking \d+ subagents.*$/gm,
  /^\d+\.\s+kiro_default:.*$/gm,
  /^Search codebase map.*$/gm,
  /^\[CodebaseMap.*$/gm,
  /^Learn more at https:\/\/kiro\.dev.*$/gm,
  /^All tools are now trusted.*$/gm,
  /^Agents can sometimes do unexpected.*$/gm,
  /^Command .* is rejected because.*$/gm,
  /^non-interactive mode.*$/gm,
  /^No problem.*I have enough.*$/gm,
  /^Let me read.*$/gm,
  /^Now let me.*$/gm,
  /^I'll (?:start|review|read|check|now|scan|audit).*$/gm,
  /^Understood.*$/gm,
  /^Purpose:.*$/gm,
];

for (const pattern of noisePatterns) {
  text = text.replace(pattern, '');
}

// Remove lines that are just ">" (thinking indicator)
text = text.replace(/^>\s*$/gm, '');

// Collapse 3+ consecutive newlines into 2
text = text.replace(/\n{3,}/g, '\n\n');

// Trim
text = text.trim();

fs.writeFileSync(outputFile, text, 'utf8');
console.log(`Cleaned ${inputFile} -> ${outputFile} (${text.length} chars)`);
