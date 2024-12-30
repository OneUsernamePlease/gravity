# bugs

# feets:
- use workers and offscreen canvas, 2 bodies at 100 tps is already too much
- collision detection
    - reflection or merging
- single step forward
- place bodies
    - via a special interface where you set mass, pos, vel,...
    - via mouse
        (obviously click for position, click and drag to set velocity, and if it is still compatible with the previous click and hold to increase mass)
- click on a body to see its properties.
    - this is gonna be hard, bc i designed the animation to be completely independent from the simulation. so it's gonna require some magic to get the simulated body by clicking the animated circle.
- let the user setup a simulationState
- speed up or slow down the sim.
- display vectors DONE
- gravity between bodies
    - simple (nested loops -> O(n²)) DONE
    - barnes-Hut (quadtree -> O(n log n))

# refactors/improvements
- units

- currently, we draw every path at every animation step (all the drawBody() calls). with a Path2D object, a path can be saved (and moved for animation). the visual representation of a body should maybe store such a path.


