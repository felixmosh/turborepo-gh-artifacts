# TurboRepo Github Artifacts action

This action allows you use Github artifacts as [TurboRepo](https://github.com/vercel/turborepo) remote cache server.

## How it works?

It's starts a local TurboRepo server (on port `9080`) and uses Github artifacts as a caching storage. 

## Setup

1. Add in your `workflow.yml` the following section **before** TurboRepo runs:
```yaml
- name: TurboRepo local server
  uses: felixmosh/turborepo-gh-artifacts@v1
  with:
    repo-token: ${{ secrets.GITHUB_TOKEN }}
    server-token: ${{ secrets.TURBO_SERVER_TOKEN }}
```
2. Make turbo repo work with the local server
```yaml
- name: Build
  run: yarn build --api="http://127.0.0.1:9080" --token="${{ secrets.TURBO_SERVER_TOKEN }}" --team="foo"
```
That's it 😋.

### Action inputs
The action has 2 **required** inputs:
1. `repo-token` - A Github token with `repo` permission, usually the default `secrets.GITHUB_TOKEN` is enough.
2. `server-token` - An auth token to ensure that your code interacting with the local server.

## Working Example

[Working example](https://github.com/felixmosh/turborepo-gh-artifacts-example) of the entire setup, based on `npx create-turbo@latest`. 

## Useful Links

- [About the GITHUB_TOKEN secret](https://docs.github.com/en/actions/security-guides/automatic-token-authentication#about-the-github_token-secret)
- [TurboRepo Caching](https://turborepo.org/docs/features/caching)
- [TurboRepo Remote Caching (Beta)](https://turborepo.org/docs/features/remote-caching)
