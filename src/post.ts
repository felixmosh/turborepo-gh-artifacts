import {setFailed} from '@actions/core';
import fs from 'fs-extra';
import { cacheDir } from './utils/constants';
import { printServerLogs } from './utils/printServerLogs';
import { stopServer } from './utils/stopServer';
import { uploadArtifacts } from './utils/uploadArtifacts';

async function post() {
  fs.ensureDirSync(cacheDir);

  stopServer();

  await uploadArtifacts();

  printServerLogs();
}

post().catch((error) => {
  setFailed(error);
});
