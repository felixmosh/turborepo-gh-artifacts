import { create } from '@actions/artifact';
import { debug, info } from '@actions/core';
import fs from 'fs-extra';
import path from 'path';
import { cacheDir } from './constants';

export async function uploadArtifacts() {
  // Upload all artifacts that were not downloaded from the current workflow
  // This avoids a list request for every cache miss in subsequent jobs of the same workflow
  const client = create();

  const files = fs.readdirSync(cacheDir);

  const artifactFiles = files.filter((filename) => filename.endsWith('.gz'));
  const currentWorkflowArtifacts = files
    .filter((filename) => filename.endsWith('.local'))
    .map((file) => path.basename(file, '.local'));

  debug(`artifact files: ${JSON.stringify(artifactFiles, null, 2)}`);
  debug(
    `artifacts downloaded from the current workflow: ${JSON.stringify(
      currentWorkflowArtifacts,
      null,
      2
    )}`
  );

  const artifactsToUpload = artifactFiles
    .map((artifactFilename) => {
      const artifactId = path.basename(
        artifactFilename,
        path.extname(artifactFilename)
      );

      return { artifactFilename, artifactId };
    })
    .filter(({ artifactId }) => !currentWorkflowArtifacts.includes(artifactId));

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
