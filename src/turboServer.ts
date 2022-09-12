import { getInput } from '@actions/core';
import express from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs-extra';
import path from 'path';
import { artifactApi } from './utils/artifactApi';
import { cacheDir, Inputs } from './utils/constants';
import { downloadArtifact, downloadSameWorkflowArtifact } from './utils/downloadArtifact';

async function startServer() {
  const port = process.env.PORT || 9080;

  fs.ensureDirSync(cacheDir);

  const app = express();
  const serverToken = getInput(Inputs.SERVER_TOKEN, {
    required: true,
    trimWhitespace: true,
  });

  app.all('*', (req, res, next) => {
    console.info(`Got a ${req.method} request`, req.path);
    const { authorization = '' } = req.headers;
    const [type = '', token = ''] = authorization.split(' ');

    if (type !== 'Bearer' || token !== serverToken) {
      return res.status(401).send('unauthorized');
    }

    next();
  });

  app.get(
    '/v8/artifacts/:artifactId',
    asyncHandler(async (req: any, res: any) => {
      const { artifactId } = req.params;

      // Attempt 1: Look for artifacts from the current workflow. Those are not returned by listArtifacts()
      try {
        await downloadSameWorkflowArtifact(artifactId, cacheDir);
      } catch (e) {
        // Attempt 2: Search matching artifacts from other workflows
        const list = await artifactApi.listArtifacts();

        const existingArtifact = list.artifacts?.find(
          (artifact) => artifact.name === artifactId
        );

        if (existingArtifact) {
          console.log(`Artifact ${artifactId} found.`);
          await downloadArtifact(existingArtifact, cacheDir);
          console.log(
            `Artifact ${artifactId} downloaded successfully to ${cacheDir}/${artifactId}.gz.`
          );
        }
      }

      const filepath = path.join(cacheDir, `${artifactId}.gz`);

      if (!fs.pathExistsSync(filepath)) {
        console.log(`Artifact ${artifactId} not found.`);
        return res.status(404).send('Not found');
      }

      const readStream = fs.createReadStream(filepath);
      readStream.on('open', () => {
        readStream.pipe(res);
      });

      readStream.on('error', (err) => {
        console.error(err);
        res.end(err);
      });
    })
  );

  app.put('/v8/artifacts/:artifactId', (req, res) => {
    const artifactId = req.params.artifactId;
    const filename = `${artifactId}.gz`;

    const writeStream = fs.createWriteStream(path.join(cacheDir, filename));

    req.pipe(writeStream);

    writeStream.on('error', (err) => {
      console.error(err);
      res.status(500).send('ERROR');
    });

    req.on('end', () => {
      res.send('OK');
    });
  });

  app.disable('etag').listen(port, () => {
    console.log(`Cache dir: ${cacheDir}`);
    console.log(`Local Turbo server is listening at http://127.0.0.1:${port}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
