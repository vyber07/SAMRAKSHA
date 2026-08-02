import { testM3ApiInfrastructure } from './api.test';

async function main() {
  await testM3ApiInfrastructure();
}

main().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
