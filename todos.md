# TODO:
    - This architecture is beyond ass
        - animation-controller should be able to be removed. run the loop in app.
        - app does not need to be a class
    - redo and activate visibility checks
    - PATHS
        - OPTIMIZATIONS:
            - split a path into subPaths AND THEN
            - cache subpath-boundingBox
                - add visibility checks
    - improve the UI
        - small controlBar using icons, which opens floating panels containing the controls
        - improve the status bar
            - maxN -> status bar can have between 1 and N fields.
            - only show when display is wide enough and only what needs to be shown
    - don't just calculate forces only before advancing a tick  
        - at every change (body placed, g changed)
        - suggestion: change the PAUSE to MOVEMENT-DISABLED, -> keep calculating but don't update positions.
    - rendering optimizations:
        - animationFrames
    - mobile / responsive
    - worker threads
    - choose gravityLowerBounds (gravity.ts) dynamically depending on mass or whatever
    - Testing: set the context such that CSS can be used (> body.ts) (works in browser context but not in node) - sadly, *environment: 'jsdom',* presents new problems

# bugs
    - drawing Paths: adding segments (no camera change) to a persistent path looks slightly different from redrawing paths. could be just a difference in rasterization - drawing many short paths vs. drawing one long path
    - handleCollisions() - objectStates are sometimes undefined - switched to using Map with cached Ids introduced this bug
    - elastic collisions (that should be 100% elastic) are not
    - in theory a body can move at above c so introduce a limit we shall
    - when Display Vectors is active, the displayed vectors for a given body are actually the vectors from the previous tick.
        - for a given simulationState, immediately calculate force/acceleration rather than calculating it when advancing to the next tick

# feets/refactors/improvements:
- have a list of all bodies, to edit their properties
- immovable bodies should have a different color

- Save/load simulationState

- restructure
    - new class UI (basically what the sandbox is now)
        - contains canvas, top menu, side menu, status bar

- improve the drawing implementations
    - save paths (circles of the bodies) instead of redefining every path every frame
    - only call draw methods if the object is (partially) within bounds DONE
    - layers

- use workers and offscreen canvas

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
