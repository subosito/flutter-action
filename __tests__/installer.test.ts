import io = require('@actions/io');
import fs = require('fs');
import path = require('path');
import nock = require('nock');

const toolDir = path.join(__dirname, 'runner', 'tools');
const tempDir = path.join(__dirname, 'runner', 'temp');
const dataDir = path.join(__dirname, 'data');

process.env['RUNNER_TOOL_CACHE'] = toolDir;
process.env['RUNNER_TEMP'] = tempDir;

import * as installer from '../src/installer';

function osName(): string {
  switch (process.platform) {
    case 'win32':
      return 'windows';
    case 'darwin':
      return 'macos';
    default:
      return process.platform;
  }
}

describe('installer tests', () => {
  beforeAll(async () => {
    await io.rmRF(toolDir);
    await io.rmRF(tempDir);
  }, 300000);

  afterAll(async () => {
    try {
      await io.rmRF(toolDir);
      await io.rmRF(tempDir);
    } catch {
      console.log('Failed to remove test directories');
    }
  }, 100000);

  it('Downloads flutter', async () => {
    await installer.getFlutter('1.0.0', 'stable');
    const sdkDir = path.join(toolDir, 'flutter', '1.0.0-stable', 'x64');

    expect(fs.existsSync(`${sdkDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(sdkDir, 'bin'))).toBe(true);
  }, 100000);

  it('Downloads flutter from beta channel', async () => {
    await installer.getFlutter('1.8.3', 'beta');
    const sdkDir = path.join(toolDir, 'flutter', '1.8.3-beta', 'x64');

    expect(fs.existsSync(`${sdkDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(sdkDir, 'bin'))).toBe(true);
  }, 100000);

  it('Downloads latest flutter release from stable channel', async () => {
    const platform = osName();

    nock('https://storage.googleapis.com', {allowUnmocked: true})
      .get(`/flutter_infra/releases/releases_${platform}.json`)
      .replyWithFile(200, path.join(dataDir, `releases_${platform}.json`));

    await installer.getFlutter('', 'stable');
    const sdkDir = path.join(
      toolDir,
      'flutter',
      '1.7.8-hotfix.4-stable',
      'x64'
    );

    expect(fs.existsSync(`${sdkDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(sdkDir, 'bin'))).toBe(true);
  }, 100000);

  it('Downloads latest flutter release using .x version syntax from dev channel', async () => {
    const platform = osName();

    nock('https://storage.googleapis.com', {allowUnmocked: true})
      .get(`/flutter_infra/releases/releases_${platform}.json`)
      .replyWithFile(200, path.join(dataDir, `releases_${platform}.json`));

    await installer.getFlutter('1.7.x', 'dev');
    const sdkDir = path.join(toolDir, 'flutter', '1.7.11-dev', 'x64');

    expect(fs.existsSync(`${sdkDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(sdkDir, 'bin'))).toBe(true);
  }, 100000);

  it('Throws if no location contains correct flutter version', async () => {
    let thrown = false;
    try {
      await installer.getFlutter('1000.0', 'dev');
    } catch {
      thrown = true;
    }
    expect(thrown).toBe(true);
  });
});
