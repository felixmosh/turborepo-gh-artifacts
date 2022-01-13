import core from '@actions/core';
import { spawn } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { cacheDir } from './utils/constants';


fs.ensureDirSync(cacheDir);

const out = fs.openSync(path.join(cacheDir, 'out.log'), 'a');
const err = fs.openSync(path.join(cacheDir, 'out.log'), 'a');

const subprocess = spawn('node', ['../turboServer/index.js'], {
  detached: true,
  stdio: ['ignore', out, err],
  env: process.env,
});

subprocess.unref();

core.info(`TURBO_LOCAL_SERVER_PID: ${subprocess.pid}`);
core.saveState('TURBO_LOCAL_SERVER_PID', subprocess.pid);
