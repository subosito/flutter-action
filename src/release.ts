import * as core from '@actions/core';
import * as httpm from '@actions/http-client';
import * as semver from 'semver';

export const storageUrl =
  'https://storage.googleapis.com/flutter_infra/releases';

interface IFlutterData {
  channel: string;
  version: string;
  rawVersion: string;
  downloadUrl: string;
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

export function getPlatform(): string {
  const platform = process.platform;

  if (platform == 'win32') {
    return 'windows';
  }

  if (platform == 'darwin') {
    return 'macos';
  }

  return platform;
}

export async function determineVersion(
  version: string,
  channel: string,
  platform: string
): Promise<IFlutterData> {
  const storage = await getReleases(platform);

  if (version === '') {
    return getLatestVersion(storage, channel);
  }

  if (version.endsWith('.x')) {
    return getWildcardVersion(storage, channel, version);
  }

  return getVersion(storage, channel, version);
}

async function getReleases(platform: string): Promise<IFlutterStorage> {
  const releasesUrl: string = `${storageUrl}/releases_${platform}.json`;
  const http: httpm.HttpClient = new httpm.HttpClient('flutter-action');
  const storage: IFlutterStorage | null = (
    await http.getJson<IFlutterStorage | null>(releasesUrl)
  ).result;

  if (!storage) {
    throw new Error('unable to get flutter releases');
  }

  return storage;
}

async function getLatestVersion(
  storage: IFlutterStorage,
  channel: string
): Promise<IFlutterData> {
  const channelVersion = storage.releases.find(release => {
    return (
      release.hash === storage.current_release[channel] &&
      validateChannel(release.channel, channel)
    );
  });

  if (!channelVersion) {
    throw new Error(`unable to get latest version from channel ${channel}`);
  }

  let rver = channelVersion.version;
  let cver = rver.startsWith('v') ? rver.slice(1, rver.length) : rver;

  core.debug(`latest version from channel ${channel} is ${rver}`);

  const flutterData: IFlutterData = {
    channel: channelVersion.channel,
    version: cver,
    rawVersion: rver,
    downloadUrl: `${storageUrl}/${channelVersion.archive}`
  };

  return flutterData;
}

function validateChannel(releaseChannel: string, channel: string) {
  return releaseChannel === channel || channel === 'any';
}

async function getWildcardVersion(
  storage: IFlutterStorage,
  channel: string,
  version: string
): Promise<IFlutterData> {
  let sver = version.endsWith('.x')
    ? version.slice(0, version.length - 2)
    : version;

  const releases = storage.releases.filter(release => {
    return (
      validateChannel(release.channel, channel) &&
      prefixCompare(sver, release.version)
    );
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
    throw new Error(`unable to find release for ${version}`);
  }

  core.debug(
    `latest version of ${version} from channel ${channel} is ${release.version}`
  );

  const flutterData = {
    channel: release.channel,
    version: cver,
    rawVersion: release.version,
    downloadUrl: `${storageUrl}/${release.archive}`
  };

  return flutterData;
}

async function getVersion(
  storage: IFlutterStorage,
  channel: string,
  version: string
): Promise<IFlutterData> {
  const release = storage.releases.find(release => {
    return (
      validateChannel(release.channel, channel) &&
      compare(version, release.version)
    );
  });

  if (!release) {
    return getWildcardVersion(storage, channel, version);
  }

  const flutterData = {
    channel: release.channel,
    version,
    rawVersion: release.version,
    downloadUrl: `${storageUrl}/${release.archive}`
  };

  return flutterData;
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
