import fs from 'fs-extra';
import StreamZip from 'node-stream-zip';
import path from 'path';
import { artifactApi } from './artifactApi';
import os from 'os';
import { create } from '@actions/artifact';

const tempArchiveFolder = path.join(
  process.env.RUNNER_TEMP || os.tmpdir(),
  'turbo-archives'
);

export async function downloadArtifact(artifact, destFolder) {
  const { data } = await artifactApi.downloadArtifact(artifact.id);
  const archiveFilepath = path.join(tempArchiveFolder, `${artifact.name}.zip`);

  fs.ensureDirSync(tempArchiveFolder);

  const writeStream = fs.createWriteStream(archiveFilepath);

  await new Promise<void>((resolve) => {
    data.pipe(writeStream);
    writeStream.on('finish', () => {
      resolve();
    });

    writeStream.on('error', (error) => {
      console.error(error);
      resolve();
    });
  });

  const zip = new StreamZip.async({ file: archiveFilepath });
  await zip.extract(null, destFolder);
  await zip.close();
}

export async function downloadSameWorkflowArtifact(artifactId: string, destFolder: string) {
  const client = create();
  await client.downloadArtifact(artifactId, destFolder, {
    createArtifactFolder: false
  });
}