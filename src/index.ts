import * as core from '@actions/core';
import * as fvf from './fvf';
import * as installer from './installer';

async function run() {
  try {
    const flutterVersion = core.getInput('flutter-version') || '';
    const channel = core.getInput('channel') || 'stable';
    const useFvf = core.getInput('flutter-versio-frigidus') || false;

    if (channel == 'master' && flutterVersion != '') {
      core.setFailed(
        'using `flutter-version` with master channel is not supported.'
      );

      return;
    }

    if (useFvf != '' && (channel != 'stable' || flutterVersion != '')) {
      core.setFailed(
        'using `flutter-versio-frigidus` with `channel` or `flutter-version` is not supported.'
      );

      return;
    }

    const version = useFvf ? fvf.getVersion() : flutterVersion;

    await installer.getFlutter(version, channel);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
