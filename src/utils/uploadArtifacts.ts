import { DefaultArtifactClient } from '@actions/artifact';
import { debug, info } from '@actions/core';
import fs from 'fs-extra';
import path from 'path';
import { artifactApi } from './artifactApi';
import { cacheDir } from './constants';

export async function uploadArtifacts() {
  const list = await artifactApi.listArtifacts();
  const existingArtifacts = (list.artifacts || []).map(
    (artifact) => artifact.name
  );

  const client = new DefaultArtifactClient();

  const files = fs.readdirSync(cacheDir);

  const artifactFiles = files.filter((filename) => filename.endsWith('.gz'));

  debug(`artifact files: ${JSON.stringify(artifactFiles, null, 2)}`);

  const artifactsToUpload = artifactFiles
    .map((artifactFilename) => {
      const artifactId = path.basename(
        artifactFilename,
        path.extname(artifactFilename)
      );

      return { artifactFilename, artifactId };
    })
    .filter(({ artifactId }) => !existingArtifacts.includes(artifactId));

  if (artifactsToUpload.length) {
    info(`Gonna upload ${artifactsToUpload.length} artifacts:`);
    info(
      JSON.stringify(
        artifactsToUpload.map(({ artifactId }) => artifactId),
        null,
        2
      )
    );
  } else {
    info(`There is nothing to upload.`);
  }

  await Promise.all(
    artifactsToUpload.map(async ({ artifactFilename, artifactId }) => {
      info(`Uploading ${artifactFilename}`);

      await client.uploadArtifact(
        artifactId,
        [path.join(cacheDir, artifactFilename)],
        cacheDir
      );

      info(`Uploaded ${artifactFilename} successfully`);
    })
  );
}
