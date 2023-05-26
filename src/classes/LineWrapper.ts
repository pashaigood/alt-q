import { Transform } from 'stream';

export class LineWrapper extends Transform {
  private maxLength: number;
  private buffer: string;

  constructor(maxLength: number) {
    super();
    this.maxLength = maxLength;
    this.buffer = '';
  }

  _transform(chunk: Buffer, _encoding: BufferEncoding, callback: () => void): void {
    this.buffer += chunk.toString();

    let lineStart = 0;
    let lastSpace = -1;
    for (let i = 0; i < this.buffer.length; i++) {
      if (this.buffer[i] === ' ') {
        lastSpace = i;
      }

      if (this.buffer[i] === '\n') {
        const line = this.buffer.slice(lineStart, i) + '\n';
        this.push(line);
        lineStart = i + 1;
        lastSpace = -1;
      } else if (i - lineStart === this.maxLength) {
        const wrapIndex = lastSpace > -1 ? lastSpace : i;
        const line = this.buffer.slice(lineStart, wrapIndex) + '\n';
        this.push(line);
        lineStart = this.buffer[wrapIndex] === ' ' ? wrapIndex + 1 : wrapIndex;
        lastSpace = -1;
      }
    }

    this.buffer = this.buffer.slice(lineStart);
    callback();
  }

  _flush(callback: () => void): void {
    if (this.buffer) {
      this.push(this.buffer + '\n');
      this.buffer = '';
    }
    callback();
  }
}
