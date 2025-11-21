import { test } from "vitest";
import { Body2d, Simulation } from "../scripts/gravity";
import { Vector2D } from "../scripts/vector2d";

test("elastic collision, two bodies, one moving towards other center", () => {

    const sim = new Simulation();
    const body1 = sim.addObject(new Body2d(100), new Vector2D(0, 0), new Vector2D(0, 0)); // stationary
    const body2 = sim.addObject(new Body2d(100), new Vector2D(0, 0), new Vector2D(0, 0)); // moving towards body1
    
});

