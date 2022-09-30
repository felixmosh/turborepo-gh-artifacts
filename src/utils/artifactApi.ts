import { getInput } from '@actions/core';
import { Axios } from 'axios';
import { Inputs } from './constants';

export interface IArtifactListResponse {
  total_count: number;
  artifacts?: Array<IArtifactResponse>;
}

export interface IArtifactResponse {
  id: number;
  node_id: string;
  name: string;
  size_in_bytes: number;
  url: string;
  archive_download_url: string;
  expired: boolean;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

class ArtifactApi {
  private axios: Axios;

  constructor() {
    const repoToken = getInput(Inputs.REPO_TOKEN, {
      required: true,
      trimWhitespace: true,
    });

    this.axios = new Axios({
      baseURL: `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/actions`,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${repoToken}`,
      },
    });
  }

  listArtifacts(): Promise<IArtifactListResponse> {
    return this.axios
      .get('/artifacts', { params: { per_page: 100 } })
      .then((response) => JSON.parse(response.data));
  }

  downloadArtifact(artifactId) {
    return this.axios.get(`/artifacts/${artifactId}/zip`, {
      responseType: 'stream',
    });
  }
}

export const artifactApi = new ArtifactApi();
