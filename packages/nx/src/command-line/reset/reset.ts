import { rmSync } from 'fs-extra';
import { daemonClient } from '../../daemon/client/client';
import {
  cacheDir,
  projectGraphCacheDirectory,
} from '../../utils/cache-directory';
import { output } from '../../utils/output';
import { nativeFileCacheLocation } from '../../native/native-file-cache-location';

export async function resetHandler() {
  output.note({
    title: 'Resetting the Nx workspace cache and stopping the Nx Daemon.',
    bodyLines: [`This might take a few minutes.`],
  });
  await daemonClient.stop();
  output.log({ title: 'Daemon Server - Stopped' });
  try {
    rmSync(nativeFileCacheLocation, { recursive: true, force: true });
  } catch (e) {
    // ignore, deleting the native file cache is not critical and can fail if another process is locking the file
  }
  rmSync(cacheDir, { recursive: true, force: true });
  if (projectGraphCacheDirectory !== cacheDir) {
    rmSync(projectGraphCacheDirectory, { recursive: true, force: true });
  }
  output.success({
    title: 'Successfully reset the Nx workspace.',
  });
}
