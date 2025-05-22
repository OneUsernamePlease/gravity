# currently/next working on:
    - some refactors
        - remove color from Body2d, (in Canvas or similar) extend Body2d and add color
        - restructure
            - sandbox is the new main -> outsource
                - pageController that coordinates everything
                - inputs.ts - remove inputs from sandbox? 
    - mobile / responsive
    - workers and offscreen canvas

# bugs
    - mobile view (or just narrow width)
    - elastic collisions (that should be 100% elastic) are not
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

# cheat sheet
switch (CanvasClickAction[selectedCanvasClickAction as keyof typeof CanvasClickAction]) {
        case CanvasClickAction.None:  
            break;
        case CanvasClickAction.AddBody:
            break;
        default:
            break;
    }
