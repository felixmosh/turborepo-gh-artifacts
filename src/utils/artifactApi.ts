import core from "@actions/core";
import { Axios } from "axios";

class ArtifactApi {
  private axios: Axios;

  constructor() {
    const repoToken = core.getInput("repo-token", {
      required: true,
      trimWhitespace: true,
    });

    this.axios = new Axios({
      baseURL: `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/actions`,
      headers: {
        Accept: "application/vnd.github.v3+json",
        Authorization: `Bearer ${repoToken}`,
      },
    });
  }

  listArtifacts() {
    return this.axios
      .get("/artifacts", { params: { per_page: 100 } })
      .then((response) => JSON.parse(response.data));
  }

  downloadArtifact(artifactId) {
    return this.axios.get(`/artifacts/${artifactId}/zip`, {
      responseType: "stream",
    });
  }
}

export const artifactApi = new ArtifactApi();
