import { info, saveState, setFailed } from '@actions/core';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { cacheDir, States } from './utils/constants';
import { downloadSameWorkflowArtifacts } from './utils/downloadArtifact';

async function main() {
  await fs.ensureDir(cacheDir);

  await downloadSameWorkflowArtifacts();

  const out = fs.openSync(path.join(cacheDir, 'out.log'), 'a');
  const err = fs.openSync(path.join(cacheDir, 'out.log'), 'a');

  const subprocess = spawn(
    'node',
    [path.resolve(__dirname, '../turboServer/index.js')],
    {
      detached: true,
      stdio: ['ignore', out, err],
      env: process.env,
    }
  );

  subprocess.unref();

  info(`${States.TURBO_LOCAL_SERVER_PID}: ${subprocess.pid}`);
  saveState(States.TURBO_LOCAL_SERVER_PID, subprocess.pid);
}

main().catch((error) => {
  setFailed(error);
});
