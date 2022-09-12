import { getInput } from '@actions/core';
import express from 'express';
import asyncHandler from 'express-async-handler';
import fs from 'fs-extra';
import path from 'path';
import { artifactApi, IArtifactListResponse } from './utils/artifactApi';
import { cacheDir, Inputs } from './utils/constants';
import { downloadArtifact } from './utils/downloadArtifact';

async function startServer() {
  const port = process.env.PORT || 9080;

  fs.ensureDirSync(cacheDir);

  const app = express();
  const serverToken = getInput(Inputs.SERVER_TOKEN, {
    required: true,
    trimWhitespace: true,
  });

  let artifactList: IArtifactListResponse | undefined

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

      const filepath = path.join(cacheDir, `${artifactId}.gz`);

      if (!fs.pathExistsSync(filepath)) {
        // Requested artifact does not belong to the current workflow, so it wasn't downloaded before
        // Check if it exists for another one
        if (!artifactList) {
          // Cache the response for the runtime of the server
          // The server is typically short-lived, so it is very unlikely that we're going to miss an artifact this way
          artifactList = await artifactApi.listArtifacts();
        }

        const existingArtifact = artifactList.artifacts?.find(
          (artifact) => artifact.name === artifactId
        );

        if (existingArtifact) {
          console.log(`Artifact ${artifactId} found.`);
          await downloadArtifact(existingArtifact, cacheDir);
        }
      }

      if (!fs.pathExistsSync(filepath)) {
        console.log(`Artifact ${artifactId} not found.`);
        return res.status(404).send('Not found');
      } else {
        console.log(
          `Artifact ${artifactId} downloaded successfully to ${filepath}.`
        );
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

  app.post('/v8/artifacts/events', (req, res) => {
    // Ignore
    res.status(200).send();
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
