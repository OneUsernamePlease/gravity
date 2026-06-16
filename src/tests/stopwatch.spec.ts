import { expect, test } from "vitest";
import { Stopwatch } from "../scripts/util/stopwatch.js";

test("Stopwatch starts", () => {
    const stopwatch: Stopwatch = new Stopwatch();
    let t: number;
    stopwatch.start();
    for (let i = 0; i < 1e4; i++) {
        // wasting time
        const x = i;
    }
    t = stopwatch.elapsed;

    expect(t).toBeGreaterThan(0);
});

test("Stopwatch continues after restarting while running", () => {
    const stopwatch: Stopwatch = new Stopwatch();
    let t1: number, t2: number;
    stopwatch.start();
    stopwatch.reset();
    t1 = stopwatch.elapsed;
    for (let i = 0; i < 1e4; i++) {
        // wasting time
        const x = i;
    }
    t2 = stopwatch.elapsed;

    expect(t1, `t1: ${t1}, t2: ${t2}`).not.toEqual(t2);
});

test("Stopwatch remains stopped after restarting while stopped", () => {
    const stopwatch: Stopwatch = new Stopwatch();
    let t: number;
    stopwatch.start();
    stopwatch.stop();
    stopwatch.reset();
    for (let i = 0; i < 1e4; i++) {
        // wasting time
        const x = i;
    }
    t = stopwatch.elapsed;

    expect(t, `t: ${t}`).toEqual(0);
});

test("Stopwatch stopping does not reset", () => {
    const stopwatch: Stopwatch = new Stopwatch();
    let t: number;
    stopwatch.start();
    for (let i = 0; i < 1e4; i++) {
        // wasting time
        const x = i;
    }
    stopwatch.stop();
    t = stopwatch.elapsed;

    expect(t).toBeGreaterThan(0);
});

test("Stopwatch is stopped after initializing", () => {
    const stopwatch: Stopwatch = new Stopwatch();
    let t: number;
    for (let i = 0; i < 1e4; i++) {
        // wasting time
        const x = i;
    }
    t = stopwatch.elapsed;

    expect(t, `t (${t}) is not 0 after initializing Stopwatch`).toEqual(0);
    expect(stopwatch.running, `stopwatch is running after initializing`).toEqual(false);
});

test("Stopwatch pausing and resuming works", () => {
    const stopwatch: Stopwatch = new Stopwatch();
    let t1: number, t2: number;

    stopwatch.start();
    for (let i = 0; i < 1e4; i++) {
        // wasting time
        const x = i;
    }
    stopwatch.stop();
    t1 = stopwatch.elapsed;
    for (let i = 0; i < 1e4; i++) {
        // wasting time
        const x = i;
    }
    t2 = stopwatch.elapsed;
    expect(t1, "Stopwatch runs after calling .stop()").toEqual(t2);

    stopwatch.start();
    for (let i = 0; i < 1e4; i++) {
        // wasting time
        const x = i;
    }

    t2 = stopwatch.elapsed;
    expect(t2, "Resuming after stopping does not work correctly").toBeGreaterThan(t1);
});

