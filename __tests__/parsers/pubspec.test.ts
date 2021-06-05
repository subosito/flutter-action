import * as fvm from '../../src/parsers/pubspec';
import mock = require("mock-fs");

describe('pubspec parser test', () => {
    afterEach(() => {
        mock.restore();
    });

    it('parse version', async () => {
        mock({
                'pubspec.yaml': "name: 'test'\n" +
                    "version: 1.0.0\n" +
                    "\n" +
                    "environment:\n" +
                    "  flutter: '2.0.6'\n" +
                    "  sdk: '>=2.10.0 <3.0.0'",
        });
        expect(await fvm.parse()).toEqual({
            version: '2.0.6',
            channel: 'any',
        });
    });
});