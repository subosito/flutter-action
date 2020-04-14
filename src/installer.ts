import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import * as httpm from '@actions/http-client';
import * as semver from 'semver';

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
  const versionPart = version.split('.').filter(Boolean);

  if (
    versionPart.length > 0 &&
    (versionPart[1] == null || versionPart[2] == null)
  ) {
    version = version.concat('.x');
  }

  const {version: selected, rawVersion, downloadUrl} = await determineVersion(
    version,
    channel
  );

  let cleanver = `${selected.replace('+', '-')}-${channel}`;
  let toolPath = tc.find('flutter', cleanver);

  if (toolPath) {
    core.debug(`Tool found in cache ${toolPath}`);
  } else {
    core.debug('Downloading Flutter from Google storage');

    const sdkFile = await tc.downloadTool(downloadUrl);

    let tempDir: string = generateTempDir();
    const sdkDir = await extractDownload(sdkFile, tempDir);
    core.debug(`Flutter sdk extracted to ${sdkDir}`);

    toolPath = await tc.cacheDir(sdkDir, 'flutter', cleanver);
  }

  core.exportVariable('FLUTTER_HOME', toolPath);
  core.addPath(path.join(toolPath, 'bin'));
  core.addPath(path.join(toolPath, 'bin', 'cache', 'dart-sdk', 'bin'));
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
    await tc.extractTar(file, destDir, 'x');
  } else {
    await tc.extractZip(file, destDir);
  }
}

async function determineVersion(
  version: string,
  channel: string
): Promise<{version: string; rawVersion: string; downloadUrl: string}> {
  if (version.endsWith('.x') || version === '') {
    return await getLatestVersion(version, channel);
  }

  return await getSelectedVersion(version, channel);
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
  archive: string;
}

interface IFlutterStorage {
  current_release: IFlutterChannel;
  releases: IFlutterRelease[];
}

async function getReleases(): Promise<IFlutterStorage> {
  const releasesUrl: string = `${storageUrl}/releases_${osName()}.json`;
  const http: httpm.HttpClient = new httpm.HttpClient('flutter-action');
  const storage: IFlutterStorage | null = (
    await http.getJson<IFlutterStorage | null>(releasesUrl)
  ).result;

  if (!storage) {
    throw new Error('unable to get flutter releases');
  }

  return storage;
}

async function getSelectedVersion(
  version: string,
  channel: string
): Promise<{version: string; rawVersion: string; downloadUrl: string}> {
  const storage = await getReleases();
  const release = storage.releases.find(release => {
    if (release.channel != channel) return false;
    return compare(version, release.version);
  });

  if (!release) {
    throw new Error(`invalid flutter version ${version}, channel ${channel}`);
  }

  return {
    version,
    rawVersion: release.version,
    downloadUrl: `${storageUrl}/${release.archive}`
  };
}

async function getLatestVersion(
  version: string,
  channel: string
): Promise<{version: string; rawVersion: string; downloadUrl: string}> {
  const storage = await getReleases();

  if (version.endsWith('.x')) {
    const sver = version.slice(0, version.length - 2);
    const releases = storage.releases.filter(release => {
      if (release.channel != channel) return false;
      return prefixCompare(sver, release.version);
    });

    const versions = releases
      .map(release => release.version)
      .map(version =>
        version.startsWith('v') ? version.slice(1, version.length) : version
      );

    const sortedVersions = versions.sort(semver.rcompare);

    let cver = sortedVersions[0];
    let release = releases.find(release => compare(cver, release.version));

    if (!release) {
      throw new Error(`unable to find release for ${cver}`);
    }

    core.debug(
      `latest version of ${version} from channel ${channel} is ${release.version}`
    );

    return {
      version: cver,
      rawVersion: release.version,
      downloadUrl: `${storageUrl}/${release.archive}`
    };
  }

  const channelVersion = storage.releases.find(
    release => release.hash === storage.current_release[channel]
  );

  if (!channelVersion) {
    throw new Error(`unable to get latest version from channel ${channel}`);
  }

  let rver = channelVersion.version;
  let cver = rver.startsWith('v') ? rver.slice(1, rver.length) : rver;

  core.debug(`latest version from channel ${channel} is ${rver}`);
  return {
    version: cver,
    rawVersion: rver,
    downloadUrl: `${storageUrl}/${channelVersion.archive}`
  };
}

function compare(version: string, releaseVersion: string): boolean {
  if (releaseVersion.startsWith('v')) {
    return releaseVersion === `v${version}`;
  }

  return releaseVersion === version;
}

function prefixCompare(version: string, releaseVersion: string): boolean {
  if (releaseVersion.startsWith('v')) {
    return releaseVersion.startsWith(`v${version}`);
  }

  return releaseVersion.startsWith(version);
}
