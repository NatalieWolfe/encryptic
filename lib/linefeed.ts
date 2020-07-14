
import {promises as fs} from 'fs';

const NEWLINE_CHAR = '\n'.charCodeAt(0);

export async function* readlines(file: fs.FileHandle) {
  const buffer = Buffer.alloc(1024);
  let offset = 0;
  let bytesRead: number;
  let lineStart = 0;
  do {
    // Read from the file.
    bytesRead = (
      await file.read(buffer, offset, buffer.length - offset)
    ).bytesRead;

    // Yield any whole lines found.
    for (let i = lineStart; i < offset + bytesRead; ++i) {
      if (buffer[i] === NEWLINE_CHAR) {
        if (lineStart < i) yield buffer.toString('utf8', lineStart, i);
        lineStart = i + 1;
      }
    }

    if (offset + bytesRead < buffer.length) {
      // Did not read a whole buffer, just increase our offset.
      offset += bytesRead;
    } else if (lineStart >= buffer.length) {
      // Buffer contained exactly a line, so just reset offset and lineStart.
      offset = 0;
      lineStart = 0;
    } else {
      // Buffer contains a partial line, copy the end to the beginning.
      buffer.copy(buffer, 0, lineStart);
      offset = buffer.length - lineStart;
      lineStart = 0;
    }
  } while (bytesRead > 0);
}

type CsvResults = string[] | Map<string, string>;
export interface CsvOptions {
  headers: string[] | boolean;
  separator: string;
}

/**
 * Reads a CSV file line-by-line. If headers are provided (either in
 * `CsvOptions` or the file itself), the results are mappings of keys to values.
 * Otherwise the results are arrays of strings.
 */
export async function* readcsv(
  file: fs.FileHandle,
  opts: CsvOptions = {headers: true, separator: ','}
): AsyncGenerator<CsvResults, void, void> {
  let headers: string[] | null = null;
  if (opts.headers instanceof Array) {
    headers = opts.headers;
  }

  for await (const line of readlines(file)) {
    const split = line.split(opts.separator);
    if (split.length === 0) continue;
    if (!headers && opts.headers === true) {
      headers = split;
      continue;
    }
    if (!headers) {
      yield split;
      continue;
    }

    const out = new Map<string, string>();
    for (let i = 0; i < headers.length && i < split.length; ++i) {
      out.set(headers[i], split[i]);
    }
    yield out;
  }
}
