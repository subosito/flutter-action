import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import * as restm from 'typed-rest-client/RestClient';
import * as semver from 'semver';
import uuidV4 from 'uuid/v4';
import {exec} from '@actions/exec/lib/exec';

const IS_WINDOWS = process.platform === 'win32';
const IS_DARWIN = process.platform === 'darwin';
const IS_LINUX = process.platform === 'linux';

const storageUrl = 'https://storage.googleapis.com/flutter_infra/releases';

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
  const versionPart = version.split('.');

  if (versionPart[1] == null || versionPart[2] == null) {
    version = version.concat('.x');
  }

  version = await determineVersion(version, channel);

  let cleanver = `${version.replace('+', '-')}-${channel}`;
  let toolPath = tc.find('flutter', cleanver);

  if (toolPath) {
    core.debug(`Tool found in cache ${toolPath}`);
  } else {
    core.debug('Downloading Flutter from Google storage');

    const downloadInfo = getDownloadInfo(version, channel);
    const sdkFile = await tc.downloadTool(downloadInfo.url);

    let tempDir: string = generateTempDir();
    const sdkDir = await extractDownload(sdkFile, tempDir);
    core.debug(`Flutter sdk extracted to ${sdkDir}`);

    toolPath = await tc.cacheDir(sdkDir, 'flutter', cleanver);
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
  const url = `${storageUrl}/${channel}/${os}/flutter_${os}_v${version}-${channel}.${ext}`;

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

async function determineVersion(
  version: string,
  channel: string
): Promise<string> {
  if (version.endsWith('.x') || version === '') {
    return await getLatestVersion(version, channel);
  }

  return version;
}

interface IFlutterChannel {
  [key: string]: string;
  beta: string;
  dev: string;
  stable: string;
}

interface IFlutterRelease {
  hash: string;
  channel: string;
  version: string;
}

interface IFlutterStorage {
  current_release: IFlutterChannel;
  releases: IFlutterRelease[];
}

async function getLatestVersion(
  version: string,
  channel: string
): Promise<string> {
  const releasesUrl: string = `${storageUrl}/releases_${osName()}.json`;
  const rest: restm.RestClient = new restm.RestClient('setup-go');
  const storage: IFlutterStorage | null = (await rest.get<IFlutterStorage | null>(
    releasesUrl
  )).result;

  if (!storage) {
    throw new Error('unable to get latest version');
  }

  if (version.endsWith('.x')) {
    const sver = version.slice(0, version.length - 2);
    const releases = storage.releases.filter(
      release =>
        release.version.startsWith(`v${sver}`) && release.channel === channel
    );
    const versions = releases.map(release =>
      release.version.slice(1, release.version.length)
    );
    const sortedVersions = versions.sort(semver.rcompare);

    core.debug(
      `latest version of ${version} from channel ${channel} is ${sortedVersions[0]}`
    );

    return sortedVersions[0];
  }

  const channelVersion = storage.releases.find(
    release => release.hash === storage.current_release[channel]
  );

  if (!channelVersion) {
    throw new Error(`unable to get latest version from channel ${channel}`);
  }

  let cver = channelVersion.version;
  cver = cver.slice(1, cver.length);

  core.debug(`latest version from channel ${channel} is ${cver}`);
  return cver;
}
