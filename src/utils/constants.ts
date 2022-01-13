import path from 'path';

export const cacheDir = path.join(
  process.env.RUNNER_TEMP || __dirname,
  'turbo-cache'
);
