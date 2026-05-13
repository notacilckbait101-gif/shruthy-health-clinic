const { spawnSync } = require('node:child_process');

const token = process.env.VERCEL_TOKEN;
const projectName = 'shruthy-health-clinic';
const domainName = 'shruthy.health.clinic';

if (!token) {
  console.error('Missing VERCEL_TOKEN environment variable.');
  process.exit(1);
}

function run(args, options = {}) {
  const result = spawnSync('npx', args, {
    cwd: __dirname,
    stdio: options.capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_OPTIONS: '--use-system-ca',
      CI: '1',
    },
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }

  return options.capture ? String(result.stdout || '').trim() : '';
}

console.log('Building before deployment...');
run(['vercel', 'build', '--prod', '--token', token]);

console.log('Deploying production build to Vercel...');
const deploymentUrl = run(
  ['vercel', 'deploy', '--prebuilt', '--prod', '--yes', '--name', projectName, '--token', token],
  { capture: true },
)
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .find((line) => line.includes('.vercel.app'));

if (!deploymentUrl) {
  console.error('Deployment URL was not returned by Vercel CLI.');
  process.exit(1);
}

console.log(`Production deployment: ${deploymentUrl}`);
console.log(`Attempting to attach domain ${domainName}...`);

run(['vercel', 'domains', 'add', domainName, projectName, '--token', token]);
run(['vercel', 'alias', 'set', deploymentUrl, domainName, '--token', token]);

console.log(`Live domain target: https://${domainName}`);
