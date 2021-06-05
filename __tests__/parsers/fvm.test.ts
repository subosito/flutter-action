import * as fvm from '../../src/parsers/fvm';
import mock = require("mock-fs");

describe('fvm parser test', () => {
    afterEach(() => {
        mock.restore();
    });

    it('parse version', async () => {
        mock({
            '.fvm': {
                'flutter_config.json': '{\n' +
                    '  "flutterSdkVersion": "2.0.6",\n' +
                    '  "flavors": {}\n' +
                    '}',
            },
        });
        expect(await fvm.parse()).toEqual({
            version: '2.0.6',
            channel: 'any',
        });
    });

    it('parse channel', async () => {
        mock({
            '.fvm': {
                'flutter_config.json': '{\n' +
                    '  "flutterSdkVersion": "dev",\n' +
                    '  "flavors": {}\n' +
                    '}',
            },
        });
        expect(await fvm.parse()).toEqual({
            version: '',
            channel: 'dev',
        });
    });
});