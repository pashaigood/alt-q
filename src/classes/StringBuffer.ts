export default class StringBuffer {
  private saveBuffer: string = '';
  private buffer: string[] = [];
  private intervalId: any;
  private callback: (data: string) => any;
  private isClosed: boolean = false;

  constructor(callback: (data: string) => void, interval: number = 25) {
    this.callback = callback;
    this.intervalId = setInterval(() => {
      this.flush();
    }, interval);
  }

  public addData(data: string) {
    if (!this.isClosed) {
      this.saveBuffer += data;
      this.buffer.push(data);
    }
  }

  private flush() {
    if (this.buffer.length === 0) {
      return;
    }
    const result = this.callback(this.buffer.join(''));
    if (result === false) {
      return;
    }
    this.buffer = [];
    if (this.isClosed) {
      this.stop();
    }
  }

  public close() {
    this.isClosed = true;
  }

  public stop() {
    clearInterval(this.intervalId);
  }

  public getData() {
    return this.saveBuffer;
  }
}
