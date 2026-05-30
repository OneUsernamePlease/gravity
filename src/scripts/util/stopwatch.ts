export class Stopwatch {
    private startTimeMs = 0
    private _elapsed = 0;
    private _running = false;

    get running() {
        return this._running;
    }
    /**
     * @returns elapsed time in milliseconds
     */
    get elapsed() {
        if (this._running) {
            return this._elapsed + performance.now() - this.startTimeMs;
        }

        return this._elapsed;
    }

    start() {
        if (this._running) return;

        this.startTimeMs = performance.now();
        this._running = true;
    }
    stop() {
        if (!this._running) return;

        this._elapsed += performance.now() - this.startTimeMs;
        this._running = false;

        return this._elapsed;
    }
    reset() {
        this._running = false;
        this.startTimeMs = 0;
        this._elapsed = 0;
    }
}
