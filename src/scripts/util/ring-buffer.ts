export class RingBuffer<T> {
    private _buffer: T[];
    private nextWriteIndex = 0;
    private currentSize = 0;

    constructor(private bufferSize: number) {
        if (bufferSize <= 0) {
            throw new Error("RingBuffer buffersize has to be > 0");   
        }
        this._buffer = new Array(bufferSize);
    }

    add(element: T) {
        this._buffer[this.nextWriteIndex] = element;
        this.nextWriteIndex++;
        this.nextWriteIndex %= this.bufferSize;
        
        if (this.currentSize < this.bufferSize) {
            this.currentSize++;
        }
    }
    toArray() {
        const result = new Array<T>(this.currentSize);
        let currentBufferIndex = (this.currentSize < this.bufferSize) ? 0 : this.nextWriteIndex;
        for (let i = 0; i < this.currentSize; i++) {
            result[i] = this._buffer[currentBufferIndex];
            currentBufferIndex++;
            currentBufferIndex %= this.bufferSize;
        }
        return result;
    }
}