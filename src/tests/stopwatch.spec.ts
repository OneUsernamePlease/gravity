import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Stopwatch } from "../scripts/util/stopwatch.js";

describe("stopwatch", () => {
    let stopwatch: Stopwatch;
    const m = 1000;

    beforeEach(() => {
        vi.useFakeTimers();
        stopwatch = new Stopwatch();
    });
    
    afterEach(() => { 
        vi.clearAllMocks();
    });

    test("initializing", () => {
        const stopwatch = new Stopwatch();

        vi.advanceTimersByTime(m);
        
        expect(stopwatch.elapsed).toEqual(0);
        expect(stopwatch.running).toEqual(false);
    });

    test("start", () => {

        stopwatch.start();

        vi.advanceTimersByTime(m);

        expect(stopwatch.elapsed).toEqual(m);
    });
    
    test("stop", () => {

        stopwatch.start();

        vi.advanceTimersByTime(m);
        
        stopwatch.stop();

        vi.advanceTimersByTime(m);

        expect(stopwatch.elapsed).toEqual(m);
    });
    
    test("restart running", () => {

        stopwatch.start();
        
        vi.advanceTimersByTime(m);
        
        stopwatch.reset();

        vi.advanceTimersByTime(m);

        expect(stopwatch.elapsed).toEqual(m);
    });
    
    test("restart stopped", () => {

        stopwatch.start();

        vi.advanceTimersByTime(m);

        stopwatch.stop();
        stopwatch.reset();

        vi.advanceTimersByTime(m);

        expect(stopwatch.elapsed).toEqual(0);
    });
    
    test("start, stop and resume", () => {

        stopwatch.start();

        vi.advanceTimersByTime(m);

        stopwatch.stop();

        vi.advanceTimersByTime(m);
    
        stopwatch.start();

        vi.advanceTimersByTime(m);
        
        expect(stopwatch.elapsed).toEqual(2 * m);
    });
});
