#!/usr/bin/env node

/**
 * Tenduck Delivery Gate Verification Script
 * 1. Anti-slop 룰 준수 여부 검증 (보라색 네온, 가짜 이모지, 과장 카피 차단)
 * 2. GitFlow 브랜치 전략 검증 (main-release-develop-feature)
 * 3. TypeScript 타입 정합성 검사 (tsc -b)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const FORBIDDEN_PATTERNS = [
  {
    regex: /from-purple|to-indigo|from-violet/i,
    rule: '[R-01] Generic Purple/Indigo Gradients Detected',
  },
  {
    regex: /✨|🔮/u,
    rule: '[R-02] Artificial AI Sparkle/Crystal Emojis in code/UI',
  },
  {
    regex: /Next-Gen|Revolutionize your workflow|Unlock the power of AI/i,
    rule: '[R-04] Fake/Hype Marketing Slop Copy Detected',
  },
];

const SRC_DIR = path.resolve(process.cwd(), 'src');

function getAllFiles(dir, exts = ['.ts', '.tsx', '.css', '.html']) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.resolve(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, exts));
    } else {
      if (exts.includes(path.extname(fullPath))) {
        results.push(fullPath);
      }
    }
  }
  return results;
}

console.log('====================================================');
console.log('🔍 Tenduck Delivery Gate: Verification Starting...');
console.log('====================================================\n');

let violations = 0;
const files = getAllFiles(SRC_DIR);

// [Step 1] Anti-Slop 정적 검증
console.log(`[Step 1/3] Scanning ${files.length} source files for Anti-Slop violations...`);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(process.cwd(), file);
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        console.error(
          `❌ [SLOP VIOLATION] ${pattern.rule}\n   File: ${relPath}:${idx + 1}\n   Code: ${line.trim()}`
        );
        violations++;
      }
    }
  });
}

if (violations === 0) {
  console.log('✅ Step 1 Passed: No Anti-Slop design violations detected.');
} else {
  console.error(`\n❌ Step 1 Failed: Found ${violations} violations. Please fix before shipping.`);
}

// [Step 2] Git 브랜치 전략 검증
console.log('\n[Step 2/3] Checking Git Branching Model (main - release - develop - feature)...');
try {
  const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  const allBranches = execSync('git branch', { encoding: 'utf8' });
  const hasDevelop = allBranches.includes('develop');

  console.log(`   - Current Branch: [${currentBranch}]`);
  console.log(`   - Develop Branch Exists: [${hasDevelop ? 'YES' : 'NO'}]`);

  const allowedPrefixes = ['feature/', 'release/', 'hotfix/', 'develop', 'main'];
  const isCompliant = allowedPrefixes.some(p => currentBranch === p || currentBranch.startsWith(p));

  if (!hasDevelop) {
    console.warn('⚠️  Warning: develop branch is missing. Please create develop branch: git branch develop');
  }

  if (isCompliant) {
    console.log(`✅ Step 2 Passed: Branch governance verified. (Current: ${currentBranch})`);
  } else {
    console.warn(`⚠️ Step 2 Note: Branch '${currentBranch}' does not match standard prefixes (feature/*, release/*, develop).`);
  }
} catch (err) {
  console.warn('⚠️ Step 2 Skipped: Git environment not accessible or not a git repo.');
}

// [Step 3] TypeScript Typecheck
console.log('\n[Step 3/3] Running TypeScript Typecheck (tsc -b)...');
try {
  execSync('npx tsc -b', { stdio: 'inherit' });
  console.log('✅ Step 3 Passed: TypeScript compilation succeeded with 0 errors.');
} catch {
  console.error('❌ Step 3 Failed: TypeScript compilation failed.');
  process.exit(1);
}

if (violations > 0) {
  process.exit(1);
}

console.log('\n====================================================');
console.log('🎉 DELIVERY GATE: ALL CHECKS PASSED (Ready to Ship)');
console.log('====================================================\n');
