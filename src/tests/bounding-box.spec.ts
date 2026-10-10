import { beforeEach, expect, test } from "vitest";
import { Vector2D } from "../scripts/util/vector2d";
import { BoundingBox } from "../scripts/util/bounding-box";

test.describe("Bounding Box", () => {
    let boundingBox: BoundingBox;

    beforeEach(() => {
        boundingBox = new BoundingBox()
    });

    test.describe("constructor", () => {
        test("construct to null", () => {
            expect(boundingBox.box).toBeNull();
            expect(boundingBox.padding).toBe(0);
        });
    
        test("construct with padding", () => {
            boundingBox = new BoundingBox({ padding: 5 });
    
            expect(boundingBox.padding).toBe(5);
            expect(boundingBox.box).toBeNull();
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
        test("reset to null", () => {
            boundingBox = new BoundingBox({ padding: 5 });

            boundingBox.update({position: new Vector2D()})

            expect(boundingBox.box).not.toBeNull();

            boundingBox.reset();
            
            expect(boundingBox.box).toBeNull();
        });
    });

    test.describe("update", () => {
        beforeEach(() => {
            boundingBox = new BoundingBox({ padding: 2 });
        });

        test("insert first element updates correctly", () => {
            
            expect(boundingBox.box).toBeNull();
            
            boundingBox.update({
                position: new Vector2D(10, 15),
            });

            expect(boundingBox.box).toEqual({
                minX: 8,
                minY: 13,
                maxX: 12,
                maxY: 17,
            })
        });

        test("insert more elements updates correctly", () => {
            
            expect(boundingBox.box).toBeNull();
            
            boundingBox.update({
                position: new Vector2D(10, 15),
            });            
            boundingBox.update({
                position: new Vector2D(8, 19),
            });

            expect(boundingBox.box).toEqual({
                minX: 6,
                minY: 13,
                maxX: 12,
                maxY: 21,
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