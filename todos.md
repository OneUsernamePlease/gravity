# bugs
- due to no collision detection, when two bodies are at the same position or very close, acceleration and velocity can go crazy.

# feets:
- collision detection
- gravity between bodies
    - simple (nested loops -> O(n²)) -> almost there
    - barnes-Hut (quadtree -> O(n log n))
- display vectors
- single step forward
- place bodies
    - via a special interface where you set mass, pos, vel,...
    - via mouse
        (obviously click for position, click and drag to set velocity, and if it is still compatible with the previous click and hold to increase mass)
- click on a body to see its properties.
    - this is gonna be hard, bc i designed the animation to be completely independent from the simulation. so it's gonna require some magic to get the simulated body by clicking the animated circle.
- let the user setup a simulationState
- speed up or slow down the sim.

# refactors/improvements
- for the simple gravity calculation, we do a nested loop, for every body, calculate the resulting force for every other body. If we have bodies A, B, A calculates the force from B, then B calculates the force from A. But the Forces are equal, right? Acceleration is calculated at a later point.
So it would be better, if we can keep track of the force applied to A by B, and when calculating the force applied to B by A, we can skip the calculation.
This would require some structural changes, i.e. use something more advanced than arrays. haven't really thought about how to implement that, just about the fact that we are doing redundant work.

- currently, we draw every path at every animation step (all the drawBody() calls). with a Path2D object, a path can be saved (and moved for animation). the visual representation of a body should maybe store such a path.


