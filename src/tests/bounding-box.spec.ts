import { beforeEach, expect, test } from "vitest";
import { Vector2D } from "../scripts/util/vector2d";
import { BoundingBox } from "../scripts/util/bounding-box";

test.describe("Bounding Box", () => {
    let boundingBox: BoundingBox;

    beforeEach(() => {
        boundingBox = new BoundingBox()
    });

    test.describe("constructor", () => {
        test("construct to 0", () => {
            expect(boundingBox.box).toEqual({
                minX: 0,
                minY: 0,
                maxX: 0,
                maxY: 0,
            });
            expect(boundingBox.padding).toBe(0);
        });
    
        test("construct with padding", () => {
            boundingBox = new BoundingBox({ padding: 5 });
    
            expect(boundingBox.padding).toBe(5);
            expect(boundingBox.box).toEqual({
                minX: -5,
                minY: -5,
                maxX: 5,
                maxY: 5,
            });
        });

        test("construct with box", () => {
            const box = {
                minX: 1,
                minY: 2,
                maxX: 10,
                maxY: 20,
            };

            boundingBox = new BoundingBox({ box });

            expect(boundingBox.box).toEqual(box);
        });

        test("construct with box and padding", () => {
             const box = {
                minX: -10,
                minY: -20,
                maxX: 10,
                maxY: 20,
            };

            boundingBox = new BoundingBox({
                box,
                padding: 3,
            });

            expect(boundingBox.box).toEqual(box);
            expect(boundingBox.padding).toBe(3);
        });


    });

    test.describe("reset", () => {
        test("reset to padding", () => {
            boundingBox = new BoundingBox({ padding: 5 });

            boundingBox.box.minX = -100;
            boundingBox.box.minY = -100;
            boundingBox.box.maxX = 100;
            boundingBox.box.maxY = 100;

            boundingBox.reset();

            expect(boundingBox.box).toEqual({
                minX: -5,
                minY: -5,
                maxX: 5,
                maxY: 5,
            });
        });

        test("reset to padding = 0", () => {
            boundingBox = new BoundingBox();

            boundingBox.box.minX = -100;
            boundingBox.box.minY = -100;
            boundingBox.box.maxX = 100;
            boundingBox.box.maxY = 100;

            boundingBox.reset();

            expect(boundingBox.box).toEqual({
                minX: 0,
                minY: 0,
                maxX: 0,
                maxY: 0,
            });
        });
    });

    test.describe("update", () => {
        beforeEach(() => {
            boundingBox = new BoundingBox({ padding: 2 });
        });

        test("updating maxX, maxY expands box", () => {
            boundingBox.update({
                position: new Vector2D(10, 15),
            });

            expect(boundingBox.box).toEqual({
                minX: -2,
                minY: -2,
                maxX: 12,
                maxY: 17,
            })
        });

        test("updating minX, minY expands box", () => {
            boundingBox.update({
                position: new Vector2D(-10, -15),
            });

            expect(boundingBox.box).toEqual({
                minX: -12,
                minY: -17,
                maxX: 2,
                maxY: 2,
            })
        });
        
        test("updating does not shrink box", () => {
            boundingBox = new BoundingBox({
                padding: 2,
                box: {
                    minX: -10,
                    minY: -10,
                    maxX: 10,
                    maxY: 10,
                },
            });

            boundingBox.update({
                position: new Vector2D(0, 0),
            });

            expect(boundingBox.box).toEqual({
                minX: -10,
                minY: -10,
                maxX: 10,
                maxY: 10,
            });
        });
    });

    test.describe("build", () => {
        beforeEach(() => {
            boundingBox = new BoundingBox({ padding: 2 });
        });
        
        test("builds from many positions", () => {
            const positions = new Map([
                [1, new Vector2D(10, 20)],
                [2, new Vector2D(-5, -10)],
                [3, new Vector2D(3, 4),],
            ]);

            boundingBox.build(positions);

            expect(boundingBox.box).toEqual({
                minX: -7,
                minY: -12,
                maxX: 12,
                maxY: 22,
            });
        })
    });
});