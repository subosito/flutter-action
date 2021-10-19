import * as fs from 'fs';

export function getVersion(): string {
  return fs.readFileSync('flutter_versio_frigidus', 'ascii');
}
