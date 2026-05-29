const { execSync } = require('child_process');
try {
  execSync('npx jest src/__tests__/community.test.ts', { stdio: 'pipe' });
} catch(e) {
  // It throws because tests fail. We don't care, we just want to see why auth fails.
}
