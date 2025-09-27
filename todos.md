# currently/next working on:
    - some refactors
        - remove color from Body2d, (in Canvas or similar) extend Body2d and add color
        - restructure
            - sandbox is the new main -> outsource
                - pageController that coordinates everything
                - inputs.ts - remove inputs from sandbox?
    - dont just calculate forces only before advancing a tick  
        - at every change (body placed, g changed)
    - canvas layers
    - mobile / responsive
    - workers and offscreen canvas
    - vitest

# bugs
    - mobile view (or just narrow width)
    - elastic collisions (that should be 100% elastic) are not
    - in theory a body can move at above c so introduce a limit we shall
    - when Display Vectors is active, the displayed acceleration vector for a given body is actually the vector from the previous tick.
        - for a given simulationState, immediately calculate force/acceleration rather than calculating it when advancing to the next tick

# feets/refactors/improvements:
- move with middle mouse, select bodies with right (secondary) mouse
- have a list of all bodies, to edit their properties
- immovable bodies should have a different color

- restructure
    - new class UI (basically what the sandbox is now)
        - contains canvas, top menu, side menu, status bar

- improve the drawing implementations
    - save paths (circles of the bodies) instead of redefining every path every frame
    - only call draw methods if the object is (partially) within bounds DONE
    - layers

- use workers and offscreen canvas

- trace paths
    - ui cbx
        - toggle on: record all positions every (sim or animation?) frame, connect them w/ lines
        - toggle off: clear paths

- better zoom
    - slider
    - touch

- collision detection
    - elastic collision DONE
    - merge on collision DONE
- single step forward DONE
- place bodies
    - via mouse click DONE
        - drag for velocity DONE
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
