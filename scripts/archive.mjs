import fs from 'fs-extra';
import { fileURLToPath } from 'node:url';
import { resolve, dirname, join, basename } from 'node:path';
import Zip from 'jszip';

async function archive() {
  const dir = dirname(fileURLToPath(import.meta.url));
  const archiveDist = resolve(dir, '../build');
  const serverDist = resolve(dir, '../server/dist');
  const clientDist = resolve(dir, '../client/dist');

  fs.ensureDirSync(archiveDist);
  fs.emptyDirSync(archiveDist);

  if (!fs.existsSync(serverDist)) {
    throw new Error('Server dist not found');
  }

  if (!fs.existsSync(clientDist)) {
    throw new Error('Client dist not found');
  }

  fs.copySync(serverDist, join(archiveDist, 'dist'));
  fs.copyFileSync(
    resolve(serverDist, '../package.json'),
    resolve(archiveDist, 'package.json'),
  );
  fs.ensureDirSync(join(archiveDist, 'dist', 'client'));
  fs.copySync(clientDist, join(archiveDist, 'dist', 'client'));

  // zip dist
  const distZip = new Zip();

  const zipDistFiles = (zip, path) => {
    const files = fs.readdirSync(path);

    files.forEach((file) => {
      const filePath = join(path, file);
      const fileStat = fs.statSync(filePath);
      if (fileStat.isDirectory()) {
        const nextZip = zip.folder(file);
        zipDistFiles(nextZip, filePath);
      } else {
        zip.file(file, fs.readFileSync(filePath));
      }
    });
  };

  zipDistFiles(distZip, join(archiveDist, 'dist'));

  distZip
    .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
    .pipe(fs.createWriteStream(resolve(archiveDist, 'dist.zip')))
    .on('finish', () => {
      console.log('Archive Success');
    });
}

archive();
