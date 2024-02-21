import {setFailed} from '@actions/core';
import fs from 'fs-extra';
import path from 'path';
import { cacheDir, newArtifactsDirName } from './utils/constants';
import { printServerLogs } from './utils/printServerLogs';
import { stopServer } from './utils/stopServer';
import { uploadArtifacts } from './utils/uploadArtifacts';

async function post() {
  stopServer();

  await uploadArtifacts();

  printServerLogs();
}

post().catch((error) => {
  setFailed(error);
});
