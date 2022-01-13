import core from '@actions/core';

function pidIsRunning(pid) {
  try {
    process.kill(+pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

export function stopServer() {
  const serverPID = core.getState('TURBO_LOCAL_SERVER_PID');

  core.info(`Found server pid: ${serverPID}`);

  if (serverPID && pidIsRunning(serverPID)) {
    core.info(`Killing server pid: ${serverPID}`);
    process.kill(+serverPID);
  } else {
    core.info(`Server with pid: ${serverPID} is not running`);
  }
}
