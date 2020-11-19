import * as core from '@actions/core';
import * as io from '@actions/io';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import * as release from './release';

export async function getFlutter(
  version: string,
  channel: string
): Promise<void> {
  const platform = release.getPlatform();
  const useMaster = channel == 'master';

  const {version: selected, downloadUrl} = await release.determineVersion(
    version,
    useMaster ? 'dev' : channel,
    platform
  );

  let cleanver = useMaster
    ? channel
    : `${selected.replace('+', '-')}-${channel}`;

  let toolPath = tc.find('flutter', cleanver);

  if (toolPath) {
    core.debug(`Tool found in cache ${toolPath}`);
  } else {
    core.debug(`Downloading Flutter from Google storage ${downloadUrl}`);

    const sdkFile = await tc.downloadTool(downloadUrl);
    const sdkCache = await tmpDir(platform);
    const sdkDir = await extract(sdkFile, sdkCache, path.basename(downloadUrl));

    toolPath = await tc.cacheDir(sdkDir, 'flutter', cleanver);
  }

  core.exportVariable('FLUTTER_ROOT', toolPath);
  core.addPath(path.join(toolPath, 'bin'));
  core.addPath(path.join(toolPath, 'bin', 'cache', 'dart-sdk', 'bin'));

  if (useMaster) {
    await exec.exec('flutter', ['channel', 'master']);
    await exec.exec('flutter', ['upgrade']);
  }
}

function tmpBaseDir(platform: string): string {
  let tempDirectory = process.env['RUNNER_TEMP'] || '';

  if (tempDirectory) {
    return tempDirectory;
  }

  let baseLocation;

  switch (platform) {
    case 'windows':
      baseLocation = process.env['USERPROFILE'] || 'C:\\';
      break;
    case 'macos':
      baseLocation = '/Users';
      break;
    default:
      baseLocation = '/home';
      break;
  }

  return path.join(baseLocation, 'actions', 'temp');
}

async function tmpDir(platform: string): Promise<string> {
  const baseDir = tmpBaseDir(platform);
  const tempDir = path.join(
    baseDir,
    'temp_' + Math.floor(Math.random() * 2000000000)
  );

  await io.mkdirP(tempDir);
  return tempDir;
}

async function extract(
  sdkFile: string,
  sdkCache: string,
  originalFilename: string
): Promise<string> {
  const fileStats = fs.statSync(path.normalize(sdkFile));

  if (fileStats.isFile()) {
    const stats = fs.statSync(sdkFile);

    if (!stats) {
      throw new Error(`Failed to extract ${sdkFile} - it doesn't exist`);
    } else if (stats.isDirectory()) {
      throw new Error(`Failed to extract ${sdkFile} - it is a directory`);
    }

    if (originalFilename.endsWith('tar.xz')) {
      await tc.extractTar(sdkFile, sdkCache, 'x');
    } else {
      await tc.extractZip(sdkFile, sdkCache);
    }

    return path.join(sdkCache, fs.readdirSync(sdkCache)[0]);
  } else {
    throw new Error(`Flutter sdk argument ${sdkFile} is not a file`);
  }
}
