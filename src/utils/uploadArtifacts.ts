import { DefaultArtifactClient } from '@actions/artifact';
import { debug, info } from '@actions/core';
import fs from 'fs-extra';
import path from 'path';
import { cacheDir, newArtifactsDirName } from './constants';

export async function uploadArtifacts() {
  const client = new DefaultArtifactClient();
  const newArtifactsDir = path.join(cacheDir, newArtifactsDirName);

  fs.ensureDirSync(newArtifactsDir);

  const files = fs.readdirSync(newArtifactsDir);

  const artifactFiles = files.filter((filename) => filename.endsWith('.gz'));

  debug(`artifact files: ${JSON.stringify(artifactFiles, null, 2)}`);

  const artifactsToUpload = artifactFiles.map((artifactFilename) => {
    const artifactId = path.basename(
      artifactFilename,
      path.extname(artifactFilename),
    );

    return { artifactFilename, artifactId };
  });

  if (artifactsToUpload.length === 0) {
    info(`There is nothing to upload.`);

    return;
  }

  info(`Gonna upload ${artifactsToUpload.length} artifacts:`);
  info(
    JSON.stringify(
      artifactsToUpload.map(({ artifactId }) => artifactId),
      null,
      2,
    ),
  );

  await Promise.all(
    artifactsToUpload.map(async ({ artifactFilename, artifactId }) => {
      info(`Uploading ${artifactFilename}`);

      try {
        await client.uploadArtifact(
          artifactId,
          [path.join(newArtifactsDir, artifactFilename)],
          newArtifactsDir,
        );

        info(`Uploaded ${artifactFilename} successfully`);

        await fs.move(path.join(newArtifactsDir, artifactFilename), path.join(newArtifactsDir, '..', artifactFilename))
      } catch (err) {
        if (err instanceof Error && err.message.includes('(409) Conflict:')) {
          // an artifact with the same hash must have been already uploaded by another job running in parallel
          info(`Artifact ${artifactFilename} already exists, skipping...`);
          return;
        }
        throw err;
      }
    }),
  );
}
