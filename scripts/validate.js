#!/usr/bin/env node
/**
 * Exia Universal Local Validation, Linting & Build Health Runner.
 * Runs seamlessly on all platforms (Windows, Linux, macOS).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');

const colors = {
  cyan: (str) => `\x1b[36m${str}\x1b[0m`,
  green: (str) => `\x1b[32m${str}\x1b[0m`,
  yellow: (str) => `\x1b[33m${str}\x1b[0m`,
  red: (str) => `\x1b[31m${str}\x1b[0m`,
};

function runStep(name, fn) {
  console.log(colors.yellow(`\n>>> ${name}`));
  try {
    fn();
    console.log(colors.green(`✓ ${name} passed.`));
  } catch (err) {
    console.error(colors.red(`✗ ${name} failed:`), err.message);
    process.exit(1);
  }
}

console.log(colors.cyan('======================================================'));
console.log(colors.cyan('   EXIA LOCAL VALIDATION & BUILD HEALTH SUITE         '));
console.log(colors.cyan('======================================================'));
console.log(`Root: ${ROOT_DIR}`);

// 1. JSON Data Validation
runStep('Step 1: JSON Schema & Config Validation', () => {
  const jsonFiles = [
    'mongodb_schema.json',
    'ui/apps/mobile/app.json',
    'ui/package.json',
    'desktop/package.json',
  ];

  for (const rel of jsonFiles) {
    const full = path.join(ROOT_DIR, rel);
    if (fs.existsSync(full)) {
      const raw = fs.readFileSync(full, 'utf8');
      JSON.parse(raw);
      console.log(`  ${colors.green('✓')} Valid JSON syntax: ${rel}`);
    }
  }
});

// 2. TypeScript Typecheck
runStep('Step 2: TypeScript Monorepo Typecheck (7 packages)', () => {
  const tscBin = path.join(ROOT_DIR, 'ui/node_modules/typescript/bin/tsc');
  const packages = [
    'ui/packages/design-tokens',
    'ui/packages/shared-types',
    'ui/packages/shared-logic',
    'ui/packages/api-client',
    'ui/packages/shared-ui',
    'ui/packages/test-utils',
    'ui/apps/mobile',
  ];

  for (const pkg of packages) {
    const tsconfig = path.join(ROOT_DIR, pkg, 'tsconfig.json');
    console.log(`  Checking ${colors.cyan(pkg)}...`);
    execSync(`node "${tscBin}" --noEmit -p "${tsconfig}"`, {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
  }
});

// 3. ESLint Code Quality Checks
runStep('Step 3: ESLint Code Quality Checks', () => {
  const eslintBin = path.join(ROOT_DIR, 'ui/apps/mobile/node_modules/eslint/bin/eslint.js');
  const mobileDir = path.join(ROOT_DIR, 'ui/apps/mobile');
  if (fs.existsSync(eslintBin)) {
    execSync(`node "${eslintBin}" src`, {
      stdio: 'inherit',
      cwd: mobileDir,
    });
  }
});

// 4. Vitest Unit Test Suite
runStep('Step 4: Vitest Unit Test Suite', () => {
  const vitestBin = path.join(ROOT_DIR, 'ui/node_modules/vitest/vitest.mjs');
  const uiDir = path.join(ROOT_DIR, 'ui');
  if (fs.existsSync(vitestBin)) {
    execSync(`node "${vitestBin}" run`, {
      stdio: 'inherit',
      cwd: uiDir,
    });
  }
});

// 5. Expo Universal Web Production Export
runStep('Step 5: Expo Universal Web Production Export', () => {
  const expoCli = path.join(ROOT_DIR, 'ui/apps/mobile/node_modules/expo/bin/cli');
  const mobileDir = path.join(ROOT_DIR, 'ui/apps/mobile');
  execSync(`node "${expoCli}" export --platform web`, {
    stdio: 'inherit',
    cwd: mobileDir,
    env: { ...process.env, EXPO_NO_TELEMETRY: '1' },
  });

  const distIndex = path.join(mobileDir, 'dist', 'index.html');
  if (!fs.existsSync(distIndex) || fs.statSync(distIndex).size === 0) {
    throw new Error(`Exported dist/index.html not found or empty!`);
  }
});

// 6. Desktop Electron Bundle Synchronization
runStep('Step 6: Desktop Electron Bundle Synchronization', () => {
  const syncScript = path.join(ROOT_DIR, 'desktop/scripts/sync-dist.js');
  const desktopDir = path.join(ROOT_DIR, 'desktop');
  if (fs.existsSync(syncScript)) {
    execSync(`node "${syncScript}"`, {
      stdio: 'inherit',
      cwd: desktopDir,
    });
  }

  const desktopIndex = path.join(desktopDir, 'dist', 'index.html');
  if (!fs.existsSync(desktopIndex) || fs.statSync(desktopIndex).size === 0) {
    throw new Error(`desktop/dist/index.html not found after sync!`);
  }
});

console.log(colors.cyan('\n======================================================'));
console.log(colors.green('   ALL LOCAL VALIDATIONS & BUILDS PASSED CLEANLY!     '));
console.log(colors.cyan('======================================================\n'));
