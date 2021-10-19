import path = require('path');
import * as fvf from '../src/fvf';

const dataDir = path.join(__dirname, 'data');

describe('fvf tests', () => {
  it('reads the file and returns correct version', () => {
    process.chdir(dataDir);

    const version = fvf.getVersion();

    expect(version).toBe('2.5.2');
  });
});
