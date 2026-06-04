# TODO:
    - This architecture is beyond ass
    - use context.setTransform instead of my current transformations - should be much  (MUCH) faster
    - PATHS
        - draw paths to an offscreen canvas, use Path2d, context.drawImage, .setTransform , .translate, .scale, .save/.restore, .
        - paths use distance/animationFrame - animation runs when sim is stopped - paths disappear when paused
        - if a pathSegment (coordinate) is outside the screen - just ignore it (when drawing)
        - tracing paths is insanely slow. kinda need to start caching the drawn paths.
        - pausing path-tracing: end of old path connects to start of new path (for the same body)
        - let user change bufferSize
        - OPTIMIZATIONS:
            - cache path-bounds
            - split a path into segments
            - simplify paths (level-of-detail, douglas-peucker)
    - improve the UI
        - small controlBar using icons, which opens floating panels containing the controls
        - improve the status bar
            - maxN -> status bar can have between 1 and N fields.
            - only show when display is wide enough and only what needs to be shown
    - don't just calculate forces only before advancing a tick  
        - at every change (body placed, g changed)
        - suggestion: change the PAUSE to MOVEMENT-DISABLED, -> keep calculating but don't update positions.
    - rendering optimizations:
        - canvas layers
        - animationFrames
        - batches
            - batch all bodies of the same color (ie. all w/ mass<100, mass>1000000)
            - batch all acc vectors
            - batch all vel vectors
            - draw in batches
                - ctx.beginPath() -> draw a batch (same stroke/fill style)
    - mobile / responsive
    - workers and offscreen canvas
    - choose gravityLowerBounds (gravity.ts) dynamically depending on mass or whatever
    - Testing: set the context such that CSS can be used (> body.ts) (works in browser context but not in node) - sadly, *environment: 'jsdom',* presents new problems

# bugs
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
