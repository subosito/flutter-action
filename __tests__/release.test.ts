import fs = require('fs');
import path = require('path');
import nock = require('nock');
import * as release from '../src/release';

const platform = release.getPlatform();

describe('release tests', () => {
  it('getPlatform', () => {
    const platformMap: {[index: string]: string} = {
      linux: 'linux',
      macos: 'darwin',
      windows: 'win32'
    };

    expect(platform).toEqual(platformMap[process.platform]);
  });

  describe('determineVersion', () => {
    beforeEach(() => {
      const dataDir = path.join(__dirname, 'data');

      nock('https://storage.googleapis.com', {allowUnmocked: true})
        .get(`/flutter_infra/releases/releases_${platform}.json`)
        .replyWithFile(200, path.join(dataDir, `releases_${platform}.json`));
    });

    afterEach(() => {
      nock.cleanAll();
      nock.enableNetConnect();
    });

    it('channel: "stable", version: ""', async () => {
      const result = await release.determineVersion('', 'stable', platform);

      expect(result.version).toEqual('1.22.0');
      expect(result.rawVersion).toEqual('1.22.0');
      expect(result.downloadUrl).toContain('1.22.0');
    });

    it('channel: "beta", version: ""', async () => {
      const result = await release.determineVersion('', 'beta', platform);

      expect(result.version).toEqual('1.22.0-12.3.pre');
      expect(result.rawVersion).toEqual('1.22.0-12.3.pre');
      expect(result.downloadUrl).toContain('1.22.0-12.3.pre');
    });

    it('channel: "dev", version: ""', async () => {
      const result = await release.determineVersion('', 'dev', platform);

      expect(result.version).toEqual('1.23.0-7.0.pre');
      expect(result.rawVersion).toEqual('1.23.0-7.0.pre');
      expect(result.downloadUrl).toContain('1.23.0-7.0.pre');
    });

    it('channel: "dev", version: "1.17.x"', async () => {
      const result = await release.determineVersion('1.17.x', 'dev', platform);

      expect(result.version).toEqual('1.17.0-dev.5.0');
      expect(result.rawVersion).toEqual('1.17.0-dev.5.0');
      expect(result.downloadUrl).toContain('1.17.0-dev.5.0');
    });

    it('channel: "dev", version: "1.17"', async () => {
      const result = await release.determineVersion('1.17', 'dev', platform);

      expect(result.version).toEqual('1.17.0-dev.5.0');
      expect(result.rawVersion).toEqual('1.17.0-dev.5.0');
      expect(result.downloadUrl).toContain('1.17.0-dev.5.0');
    });

    it('channel: "dev", version: "1.7.x" (old format)', async () => {
      const result = await release.determineVersion('1.7.x', 'dev', platform);

      expect(result.version).toEqual('1.7.11');
      expect(result.rawVersion).toEqual('v1.7.11');
      expect(result.downloadUrl).toContain('v1.7.11');
    });

    it('channel: "dev", version: "1.7" (old format)', async () => {
      const result = await release.determineVersion('1.7', 'dev', platform);

      expect(result.version).toEqual('1.7.11');
      expect(result.rawVersion).toEqual('v1.7.11');
      expect(result.downloadUrl).toContain('v1.7.11');
    });

    it('channel: "dev", version: "0.12.x" (unknown)', async () => {
      try {
        await release.determineVersion('0.12.x', 'dev', platform);
      } catch (e) {
        expect(e.message).toEqual('unable to find release for 0.12.x');
      }
    });

    it('channel: "dev", version: "0.12" (unknown)', async () => {
      try {
        await release.determineVersion('0.12', 'dev', platform);
      } catch (e) {
        expect(e.message).toEqual('unable to find release for 0.12');
      }
    });

    it('channel: "dev", version: "1.17.0-dev.5.0"', async () => {
      const result = await release.determineVersion(
        '1.17.0-dev.5.0',
        'dev',
        platform
      );

      expect(result.version).toEqual('1.17.0-dev.5.0');
      expect(result.rawVersion).toEqual('1.17.0-dev.5.0');
      expect(result.downloadUrl).toContain('1.17.0-dev.5.0');
    });
  });
});
