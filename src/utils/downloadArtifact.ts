import fs from 'fs-extra';
import StreamZip from 'node-stream-zip';
import path from 'path';
import { artifactApi } from './artifactApi';
import os from 'os';
import { create } from '@actions/artifact';
import { cacheDir } from './constants';

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

export async function downloadSameWorkflowArtifacts() {
  const client = create();
  // Try to download all artifacts from the current workflow, but do not fail the build if this fails
  const artifacts = await client.downloadAllArtifacts(cacheDir).catch((e) => {
    console.error(`Failed to download workflow artifacts: ${e.message}`);
    return [];
  });

  // downloadAllArtifacts creates folder with the artifact name and puts the artifact in there
  // We need to move the artifact to the destFolder, so the server can find them
  for (const artifact of artifacts) {
    const artifactFileName = path.join(
      artifact.downloadPath,
      `${artifact.artifactName}.gz`
    );
    try {
      await fs.move(
        artifactFileName,
        path.join(cacheDir, `${artifact.artifactName}.gz`)
      );
      // Remember that this artifact was downloaded from the current workflow
      await fs.createFile(
        path.join(cacheDir, `${artifact.artifactName}.local`)
      );
      await fs.remove(artifact.downloadPath);
    } catch (e: any) {
      console.error(
        `Failed to download artifact ${artifact.artifactName}: ${e.message}`
      );
    }
  }
}
