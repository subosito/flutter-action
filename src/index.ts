import * as core from '@actions/core';
import * as installer from './installer';
import * as fvm from './parsers/fvm';
import * as pubspec from './parsers/pubspec';

async function run() {
  try {
    const version = await getVersion();
    if (version) {
      await installer.getFlutter(version);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function getVersion(): Promise<IFlutterVersion | undefined> {
  const parse = core.getInput('parse');

  if (parse) {
    switch (parse) {
      case 'pubspec':
        return pubspec.parse();
      case 'fvm':
        return fvm.parse();
      default:
        core.setFailed('unknown `parse` input specified.');
        return;
    }
  } else {
    const version = {
      version: core.getInput('flutter-version') || '',
      channel: core.getInput('channel') || 'stable'
    };

    if (version.channel == 'master' && version.version != '') {
      core.setFailed(
        'using `flutter-version` with master channel is not supported.'
      );
    }
    return version;
  }
}

run();
