# currently/next working on:
    - some refactors are probably necessary now

    - workers and offscreen canvas
    - resizeCanvas
    - trace orbit paths
    - collision detection and merging bodies
    - drag to add body w/ velocity, on touchscreen

# bugs
    - mobile view (or just narrow width)
    - in theory a body can move at above c so introduce a limit we shall

# feets:
- improve the drawing implementations (layering, only call draw methods if the object is within bounds, replace path tracing with creating objects from a path once and saving them (if that works - i have no idea, but it seems like this is how it *should* work))
- use workers and offscreen canvas

- better zoom
    - slider
    - touch
    ( - click and drag canvas ie. drag a rectangle which will cover the new view)

- resize canvas (especially for mobile)
    - just use fullscreen

- collision detection
    - elastic collision
    - merge on collision DONE
- single step forward
- place bodies
    - via mouse click DONE
        - drag for velocity DONE
        - click and hold to increase mass
- click on a body to see its properties.
- speed up or slow down the sim.
- display vectors DONE
- display coordinate system
- gravity between bodies
    - simple DONE
    - barnes-Hut

# refactors/improvements
- currently, we draw every path at every animation step (all the drawBody() calls). with a Path2D object, a path can be saved (and moved for animation). the visual representation of a body should maybe store such a path.


