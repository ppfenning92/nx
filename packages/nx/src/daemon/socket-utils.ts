import { unlinkSync } from 'fs';
import { platform } from 'os';
import { join, resolve } from 'path';
import { DAEMON_SOCKET_PATH, socketDir } from './tmp-dir';
import { DaemonProjectGraphError } from './daemon-project-graph-error';

export const isWindows = platform() === 'win32';

/**
 * For IPC with the daemon server we use unix sockets or windows named pipes, depending on the user's operating system.
 *
 * See https://nodejs.org/dist/latest-v14.x/docs/api/net.html#net_identifying_paths_for_ipc_connections for a full breakdown
 * of OS differences between Unix domain sockets and named pipes.
 */
export const FULL_OS_SOCKET_PATH = isWindows
  ? '\\\\.\\pipe\\nx\\' + resolve(DAEMON_SOCKET_PATH)
  : resolve(DAEMON_SOCKET_PATH);

export const FORKED_PROCESS_OS_SOCKET_PATH = (id: string) => {
  let path = resolve(join(socketDir, 'fp' + id + '.sock'));
  return isWindows ? '\\\\.\\pipe\\nx\\' + resolve(path) : resolve(path);
};

export function killSocketOrPath(): void {
  try {
    unlinkSync(FULL_OS_SOCKET_PATH);
  } catch {}
}

// Include the original stack trace within the serialized error so that the client can show it to the user.
function serializeError(error: Error | null): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof DaemonProjectGraphError) {
    error.errors = error.errors.map((e) => JSON.parse(serializeError(e)));
  }

  return `{${Object.getOwnPropertyNames(error)
    .map((k) => `"${k}": ${JSON.stringify(error[k])}`)
    .join(',')}}`;
}

// Prepare a serialized project graph result for sending over IPC from the server to the client
export function serializeResult(
  error: Error | null,
  serializedProjectGraph: string | null,
  serializedSourceMaps: string | null
): string | null {
  // We do not want to repeat work `JSON.stringify`ing an object containing the potentially large project graph so merge as strings
  return `{ "error": ${serializeError(
    error
  )}, "projectGraph": ${serializedProjectGraph}, "sourceMaps": ${serializedSourceMaps} }`;
}
