import busboy from 'busboy';
import fs from 'fs';
import os from 'os';
import path from 'path';

interface Fields {
  [key: string]: string | undefined;
}

interface FileData {
  filename: string;
  content: Buffer;
}

interface Uploads {
  [key: string]: FileData[] | undefined;
}

export function extractMultipartFormData(req: any /* : Request */): Promise<{ fields: Fields; uploads: Uploads }> {
  return new Promise((resolve, reject) => {
    if (req.method !== 'POST') {
      return reject(405);
    } else {
      const busboyVar = busboy({ headers: req.headers });
      const tmpdir = os.tmpdir();
      const fields: Fields = {};
      const fileWrites: Promise<void>[] = [];
      const uploads: { [key: string]: { filepath: string; filename: string }[] } = {};

      busboyVar.on('field', (fieldname, val) => {
        fields[fieldname] = val;
      });

      busboyVar.on('file', (fieldname, file, filename) => {
        const filepath = path.join(tmpdir, filename.filename);
        const writeStream = fs.createWriteStream(filepath);

        if (!uploads[fieldname]) {
          uploads[fieldname] = [];
        }
        uploads[fieldname].push({ filepath, filename: filename.filename });

        file.pipe(writeStream);

        const promise = new Promise<void>((resolve, reject) => {
          file.on('end', () => {
            writeStream.end();
          });
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        fileWrites.push(promise);
      });

      busboyVar.on('finish', async () => {
        const result: { fields: Fields; uploads: Uploads } = { fields, uploads: {} };

        await Promise.all(fileWrites);

        for (const field in uploads) {
          result.uploads[field] = uploads[field].map(({ filepath, filename }) => {
            const fileBuffer = fs.readFileSync(filepath);
            fs.unlinkSync(filepath);
            return { filename, content: fileBuffer };
          });
        }

        resolve(result);
      });

      busboyVar.on('error', reject);

      if (req.rawBody) {
        busboyVar.end(req.rawBody);
      } else {
        req.pipe(busboyVar);
      }
    }
  });
}
