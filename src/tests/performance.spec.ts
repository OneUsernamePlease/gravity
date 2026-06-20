import { expect, test } from "vitest";
import { SimplePerformance } from '../scripts/util/simple-performance';

test("Format as string", () => {
    {
        const ms = 999;
        const performance: SimplePerformance = new SimplePerformance(ms);
        expect(performance.intervalFormatted).equals(`999.00 ms`)
    }
    {
        const ms = 1000;
        const performance: SimplePerformance = new SimplePerformance(ms);
        expect(performance.intervalFormatted).equals(`1.00 sec`)
    }    
    {
        const ms = 59990;
        const performance: SimplePerformance = new SimplePerformance(ms);
        expect(performance.intervalFormatted).equals(`59.99 sec`)
    }
    {
        const ms = 60000;
        const performance: SimplePerformance = new SimplePerformance(ms);
        expect(performance.intervalFormatted).equals(`1.00 min`)
    }
    {
        const ms = 3600000;
        const performance: SimplePerformance = new SimplePerformance(ms);
        expect(performance.intervalFormatted).equals(`1.00 h`)
    }
})