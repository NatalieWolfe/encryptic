import {promises as fs} from 'fs';
import * as path from 'path';

import {sequelize} from '../lib/database';
import {Password, Chunk, PasswordChunk} from '../lib/passwords';
import {CsvOptions, readcsv} from '../lib/linefeed';

(async () => {
  await sequelize.sync({force: true});

  await sequelize.transaction(async (transaction) => {
    const datafile = await fs.open(path.resolve(__dirname, '../data/cred'), 'r');
    const options: CsvOptions = {headers: false, separator: '-|-'};
    for await (const line of readcsv(datafile, options)) {
      // uid-|-username-|-email-|-password-|-hint|--
      const [, username, email, encodedPassword, hint] = line as string[];

      const [password, created] = await Password.findOrCreate({
        where: {email},
        defaults: {email, hint, username: username.length ? username : null},
        transaction
      });
      if (!created) continue;

      const chunks: PasswordChunk[] = [];
      const passBuffer = Buffer.from(encodedPassword, 'base64');
      const CHUNK_SIZE = 8;
      for (let i = 0; i < passBuffer.length; i += CHUNK_SIZE) {
        const slice = passBuffer.slice(i, i + CHUNK_SIZE);
        const [chunk,] = await Chunk.findOrCreate({
          where: {chunk: slice.toString('hex')},
          transaction
        });

        const [passChunk,] = await PasswordChunk.findOrCreate({
          where: {passwordId: password.id, chunkOrder: chunks.length},
          defaults: {
            passwordId: password.id,
            chunkId: chunk.id,
            chunkOrder: chunks.length
          },
          transaction
        });

        chunks.push(passChunk);
      }

      await password.setChunks(chunks, {transaction});
    }
  });
})();
