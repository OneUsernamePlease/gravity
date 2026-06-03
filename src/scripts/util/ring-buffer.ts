export class RingBuffer<T> implements Iterable<T> {
    private _buffer: T[];
    private _currentSize = 0;
    private nextWriteIndex = 0;
    constructor(private readonly _bufferSize: number) {
        if (_bufferSize <= 0) {
            throw new Error("RingBuffer buffersize has to be > 0");   
        }
        this._buffer = new Array(_bufferSize);
    }
    [Symbol.iterator](): Iterator<T> {
        throw new Error("Method not implemented.");
    }

    get bufferSize() {
        return this._bufferSize;
    }
    get currentSize() {
        return this._currentSize;
    }
    add(element: T) {
        this._buffer[this.nextWriteIndex] = element;
        this.nextWriteIndex++;
        this.nextWriteIndex %= this._bufferSize;
        
        if (this._currentSize < this._bufferSize) {
            this._currentSize++;
        }
    }
    /**
     * this has to allocate a bunch of stuff, use forEach if possible.
     * @returns a new Array of the elements in this RingBuffer.
     */
    toArray() {
        const result = new Array<T>(this._currentSize);
        let currentBufferIndex = (this._currentSize < this._bufferSize) ? 0 : this.nextWriteIndex;
        for (let i = 0; i < this._currentSize; i++) {
            result[i] = this._buffer[currentBufferIndex];
            currentBufferIndex++;
            currentBufferIndex %= this._bufferSize;
        }
        return result;
    }
    forEach(
        callback: (value: T, index: number, buffer: RingBuffer<T>) => void
    ): void {
        let currentBufferIndex = this._currentSize < this._bufferSize ? 0 : this.nextWriteIndex;

        for (let i = 0; i < this._currentSize; i++) {
            callback(this._buffer[currentBufferIndex], i, this);

            currentBufferIndex++;
            currentBufferIndex %= this._bufferSize;
        }
    }
}