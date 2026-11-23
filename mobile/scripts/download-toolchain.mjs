// Project-local build prerequisites. No PATH or machine settings are changed.
// Published SHA-256 digests are checked before extraction. The owner accepted
// Google's SDK licence on 23 November 2026; this script does not accept licences.
import { mkdir, readFile, stat } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = path.join(root, '.android-tools/downloads');
const packages = {
  java: { file: 'temurin-21.0.13.1-windows-x64.zip', checksum: 'bbebea1469996b276683c9299c227b294f85c847039c82633218186a4ad4fbf2',
    url: 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13.1%2B2/OpenJDK21U-jdk_x64_windows_hotspot_21.0.13.1_2.zip' },
  sdk: { file: 'commandlinetools-win-15859902_latest.zip', checksum: '90ae805d20434428bffcb699c290860f19bb5f66a67e6b330067e3de801fb04a',
    url: 'https://dl.google.com/android/repository/commandlinetools-win-15859902_latest.zip' },
};
const item = packages[process.argv[2] || 'java'];
if (!item) throw new Error('Choose java or sdk.');
const file = path.join(folder, item.file), checksum = item.checksum;
await mkdir(folder, { recursive: true });
const digest = async () => createHash('sha256').update(await readFile(file)).digest('hex');
if (!(await stat(file).catch(() => null)) || await digest() !== checksum) {
  const response = await fetch(item.url);
  if (!response.ok || !response.body) throw new Error('Tool download failed: ' + response.status);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(file));
}
if (await digest() !== checksum) throw new Error('Checksum mismatch. Do not extract this archive.');
console.log('Verified build-tool archive: ' + file);
