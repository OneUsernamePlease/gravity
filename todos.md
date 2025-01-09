# currently/next working on:
    - some refactors are probably necessary now

    - zoom, moving, resizeCanvas
    - add bodies
        - click, drag
    - workers and offscreen canvas
    - trace orbit paths

# bugs
    - moving (scrolling) when zoomed far out moves by too little
    - mobile view (or just narrow width)

    - in theory a body can move at above c so introduce a limit we shall

# feets:
- improve the drawing implementations (layering, only call draw methods if the object is within bounds, replace path tracing with creating objects from a path once and saving them (if that works - i have no idea, but it seems like this is how it *should* work))
- use workers and offscreen canvas, 2 bodies at 100 tps is already too much

- zoom with mouseWheel (und wamma ganz motiviert san mochma an touchscreen zoom ah nu)
- move by dragging

- collision detection
    - reflection or merging
- single step forward
- place bodies
    - via a special interface where you set mass, pos, vel,...
    - via mouse
        (obviously click for position, click and drag to set velocity, and if it is still compatible with the previous click and hold to increase mass)
- click on a body to see its properties.
    - this is gonna be hard, bc i designed the animation to be completely independent from the simulation. so it's gonna require some magic to get the simulated body by clicking the animated circle.
- speed up or slow down the sim.
- display vectors DONE
- gravity between bodies
    - simple DONE
    - barnes-Hut

# refactors/improvements
- currently, we draw every path at every animation step (all the drawBody() calls). with a Path2D object, a path can be saved (and moved for animation). the visual representation of a body should maybe store such a path.


