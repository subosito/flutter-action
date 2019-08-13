import io = require('@actions/io');
import fs = require('fs');
import path = require('path');

const toolDir = path.join(__dirname, 'runner', 'tools');
const tempDir = path.join(__dirname, 'runner', 'temp');

process.env['RUNNER_TOOL_CACHE'] = toolDir;
process.env['RUNNER_TEMP'] = tempDir;

import * as installer from '../src/installer';

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
    await installer.getFlutter('v1.7.8+hotfix.4', 'stable');
    const sdkDir = path.join(toolDir, 'Flutter', 'v1.7.8+hotfix.4-stable');

    expect(fs.existsSync(`${sdkDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(sdkDir, 'bin'))).toBe(true);
  }, 100000);

  it('Downloads flutter from beta channel', async () => {
    await installer.getFlutter('v1.8.3', 'beta');
    const sdkDir = path.join(toolDir, 'Flutter', 'v1.8.3-beta');

    expect(fs.existsSync(`${sdkDir}.complete`)).toBe(true);
    expect(fs.existsSync(path.join(sdkDir, 'bin'))).toBe(true);
  }, 100000);
});
