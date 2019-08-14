import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import uuidV4 from 'uuid/v4';
import {exec} from '@actions/exec/lib/exec';

const IS_WINDOWS = process.platform === 'win32';
const IS_DARWIN = process.platform === 'darwin';
const IS_LINUX = process.platform === 'linux';

let tempDirectory = process.env['RUNNER_TEMP'] || '';

if (!tempDirectory) {
  let baseLocation;

  if (IS_WINDOWS) {
    baseLocation = process.env['USERPROFILE'] || 'C:\\';
  } else {
    if (process.platform === 'darwin') {
      baseLocation = '/Users';
    } else {
      baseLocation = '/home';
    }
  }

  tempDirectory = path.join(baseLocation, 'actions', 'temp');
}

export async function getFlutter(
  version: string,
  channel: string
): Promise<void> {
  // make semver compatible, eg: 1.7.8+hotfix.4 -> 1.7.8-hotfix.4
  const semver = version.replace('+', '-');
  const cleanver = `${semver}-${channel}`;
  let toolPath = tc.find('Flutter', cleanver);

  if (toolPath) {
    core.debug(`Tool found in cache ${toolPath}`);
  } else {
    core.debug('Downloading Flutter from Google storage');

    const downloadInfo = getDownloadInfo(version, channel);
    const sdkFile = await tc.downloadTool(downloadInfo.url);

    let tempDir: string = generateTempDir();
    const sdkDir = await extractDownload(sdkFile, tempDir);
    core.debug(`Flutter sdk extracted to ${sdkDir}`);

    toolPath = await tc.cacheDir(sdkDir, 'Flutter', cleanver);
  }

  core.exportVariable('FLUTTER_HOME', toolPath);
  core.addPath(path.join(toolPath, 'bin'));
}

function osName(): string {
  if (IS_DARWIN) return 'macos';
  if (IS_WINDOWS) return 'windows';

  return process.platform;
}

function extName(): string {
  if (IS_LINUX) return 'tar.xz';

  return 'zip';
}

function getDownloadInfo(
  version: string,
  channel: string
): {version: string; url: string} {
  const os = osName();
  const ext = extName();
  const url = `https://storage.googleapis.com/flutter_infra/releases/${channel}/${os}/flutter_${os}_v${version}-${channel}.${ext}`;

  return {
    version,
    url
  };
}

function generateTempDir(): string {
  return path.join(
    tempDirectory,
    'temp_' + Math.floor(Math.random() * 2000000000)
  );
}

async function extractDownload(
  sdkFile: string,
  destDir: string
): Promise<string> {
  await io.mkdirP(destDir);

  const sdkPath = path.normalize(sdkFile);
  const stats = fs.statSync(sdkPath);

  if (stats.isFile()) {
    await extractFile(sdkFile, destDir);

    const sdkDir = path.join(destDir, fs.readdirSync(destDir)[0]);

    return sdkDir;
  } else {
    throw new Error(`Flutter sdk argument ${sdkFile} is not a file`);
  }
}

async function extractFile(file: string, destDir: string): Promise<void> {
  const stats = fs.statSync(file);

  if (!stats) {
    throw new Error(`Failed to extract ${file} - it doesn't exist`);
  } else if (stats.isDirectory()) {
    throw new Error(`Failed to extract ${file} - it is a directory`);
  }

  if ('tar.xz' === extName()) {
    await extractTarXz(file, destDir);
  } else {
    if (IS_DARWIN) {
      await extractZipDarwin(file, destDir);
    } else {
      await tc.extractZip(file, destDir);
    }
  }
}

/**
 * Extract a tar.xz
 *
 * @param file     path to the tar.xz
 * @param dest     destination directory. Optional.
 * @returns        path to the destination directory
 */
export async function extractTarXz(
  file: string,
  dest?: string
): Promise<string> {
  if (!file) {
    throw new Error("parameter 'file' is required");
  }

  dest = dest || (await _createExtractFolder(dest));
  const tarPath: string = await io.which('tar', true);
  await exec(`"${tarPath}"`, ['xC', dest, '-f', file]);

  return dest;
}

async function _createExtractFolder(dest?: string): Promise<string> {
  if (!dest) {
    dest = path.join(tempDirectory, uuidV4());
  }

  await io.mkdirP(dest);
  return dest;
}

async function extractZipDarwin(file: string, dest: string): Promise<void> {
  const unzipPath = path.join(
    __dirname,
    '..',
    'scripts',
    'externals',
    'unzip-darwin'
  );
  await exec(`"${unzipPath}"`, [file], {cwd: dest});
}
