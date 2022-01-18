import os from 'os';
import path from 'path';

export const cacheDir = path.join(
  process.env.RUNNER_TEMP || os.tmpdir(),
  'turbo-cache'
);

export enum States {
  TURBO_LOCAL_SERVER_PID = 'TURBO_LOCAL_SERVER_PID',
}

export enum Inputs {
  SERVER_TOKEN = 'server-token',
  REPO_TOKEN = 'repo-token',
}
