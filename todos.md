# currently/next working on:
    - some refactors
        - move things from main.ts to separate files
            - class Simulation which combines canvas + gravity ?
        - remove mouseMove and touchMove, then check whether we are inside the canvas when releasing
        - remove color from Body2d, (in Canvas or similar) extend Body2d and add color
    - workers and offscreen canvas
    - mobile / responsive

# bugs
    - mobile view (or just narrow width)
    - in theory a body can move at above c so introduce a limit we shall
    - when Display Vectors is active, the displayed acceleration vector for a given body is actually the vector from the previous tick.
        - for a given simulationState, immediately calculate force/acceleration rather than calculating it when advancing to the next tick

# feets/refactors/improvements:
- improve the drawing implementations
    - save paths (circles of the bodies) instead of redefining every path every frame
    - only call draw methods if the object is (partially) within bounds
    - layers

- use workers and offscreen canvas

- trace orbit paths

- better zoom
    - slider
    - touch

- resize canvas (especially for mobile)
    - just use fullscreen

- collision detection
    - elastic collision DONE
    - merge on collision DONE
- single step forward DONE
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


