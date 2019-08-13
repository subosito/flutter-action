import * as core from '@actions/core';
import * as installer from './installer';
import * as path from 'path';

async function run() {
  try {
    const version = core.getInput('version', {required: true});
    const channel = core.getInput('channel', {required: false}) || 'stable';

    await installer.getFlutter(version, channel);

    const matchersPath = path.join(__dirname, '..', '.github');
    console.log(`##[add-matcher]${path.join(matchersPath, 'flutter.json')}`);
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
