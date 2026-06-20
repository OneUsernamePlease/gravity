import { Stopwatch } from "./stopwatch.js";

export class SimplePerformance {
    private _stopwatch: Stopwatch = new Stopwatch();
    private _measurementsLastInterval: number = 0;
    private _measurementsCurrentInterval: number = 0;
    private _lastIntervalStartTimeStamp: number = 0;

    constructor(private _intervalMs = 1000) {
        if (_intervalMs <= 0) {
            throw new Error("intervalMs cannot be 0 or less");
        }
    }
    get intervalFormatted(): string {
        const msPerSec = 1000;
        const msPerMin = 60000;
        const msPerH = 3600000;
        if (this._intervalMs < msPerSec) {
            return `${this._intervalMs.toFixed(2)} ms`;
        }
        if (this._intervalMs < msPerMin) {
            return `${(this._intervalMs / msPerSec).toFixed(2)} sec`;
        }
        if (this._intervalMs < msPerH) {
            return `${(this._intervalMs / msPerMin).toFixed(2)} min`;
        }
        return `${(this._intervalMs / msPerH).toFixed(2)} h`;
    }
    get running() {
        return this._stopwatch.running;
    }
    get elapsed() {
        return this._stopwatch.elapsed;
    }
    get measurementsLastInterval() {
        return this._measurementsLastInterval;
    }
    start() {
        if (this.running) {
            return;
        }
        this._stopwatch.start();
        this._lastIntervalStartTimeStamp = this.elapsed;
    }
    stop() {
        if (!this.running) {
            return;
        }
        this._stopwatch.stop();
        
        this._measurementsCurrentInterval = 0;
        this._lastIntervalStartTimeStamp = 0;
    }
    reset() {
        this._stopwatch.reset();
        
        this._measurementsCurrentInterval = 0;
        this._measurementsLastInterval = 0;
        this._lastIntervalStartTimeStamp = this.elapsed;
    }
    measure() {
        if (!this.running) {
            return;
        }

        this._measurementsCurrentInterval++;

        const elapsedSinceLastIntervalStart = this.elapsed - this._lastIntervalStartTimeStamp;
        if (elapsedSinceLastIntervalStart >= this._intervalMs) {
            this._measurementsLastInterval = (this._measurementsCurrentInterval / elapsedSinceLastIntervalStart ) * this._intervalMs;
            this._lastIntervalStartTimeStamp = this.elapsed;
            this._measurementsCurrentInterval = 0;
        }
    }
}
