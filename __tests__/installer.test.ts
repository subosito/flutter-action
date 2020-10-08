import io = require('@actions/io');
import exec = require('@actions/exec');
import fs = require('fs');
import path = require('path');
import nock = require('nock');

const toolDir = path.join(__dirname, 'runner', 'tools');
const tempDir = path.join(__dirname, 'runner', 'temp');
const dataDir = path.join(__dirname, 'data');

process.env['RUNNER_TOOL_CACHE'] = toolDir;
process.env['RUNNER_TEMP'] = tempDir;

import * as installer from '../src/installer';
import * as release from '../src/release';

describe('installer tests', () => {
  beforeAll(async () => {
    await io.rmRF(toolDir);
    await io.rmRF(tempDir);
  }, 100000);

  beforeEach(() => {
    const platform = release.getPlatform();
    nock('https://storage.googleapis.com', {allowUnmocked: true})
      .get(`/flutter_infra/releases/releases_${platform}.json`)
      .replyWithFile(200, path.join(dataDir, `releases_${platform}.json`));
  });

  afterEach(async () => {
    nock.cleanAll();
    nock.enableNetConnect();

    await io.rmRF(toolDir);
    await io.rmRF(tempDir);
  }, 100000);

  it('Downloads flutter', async () => {
    await installer.getFlutter('1.0.0', 'stable');
    const sdkDir = path.join(toolDir, 'flutter', '1.0.0-stable', 'x64');

    expect(fs.existsSync(`${sdkDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(sdkDir, 'bin'))).toBe(true);
  }, 300000);

  it('Downloads flutter from master channel', async () => {
    await installer.getFlutter('', 'master');
    const sdkDir = path.join(toolDir, 'flutter', 'master', 'x64');

    let stdout = '';

    const options = {
      listeners: {
        stdout: (data: Buffer) => {
          stdout += data.toString();
        }
      }
    };

    expect(fs.existsSync(`${sdkDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(sdkDir, 'bin'))).toBe(true);

    await exec.exec(path.join(sdkDir, 'bin', 'flutter'), ['channel'], options);
    expect(stdout).toContain('* master');
  }, 300000);

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
