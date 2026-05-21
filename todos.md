# TODO:
    - dragging into the canvas sometimes triggers a new body, even if pointerDown happened off the canvas.
    - improve the UI
        - split ui.ts further into its components (top menu, controlBar, footer/statusBar)
        - small controlBar using icons, which opens floating panels containing the controls
        - improve the status bar
            - maxN -> status bar can have between 1 and N fields.
            - only show when display is wide enough and only what needs to be shown
    - don't just calculate forces only before advancing a tick  
        - at every change (body placed, g changed)
    - canvas layers
    - mobile / responsive
    - workers and offscreen canvas
    - choose gravityLowerBounds (gravity.ts) dynamically depending on mass or whatever
    - color for bodies
        - let user choose
        - randomize
        - mass-dependant 
    - Testing: set the context such that CSS can be used (> body.ts) (works in browser context but not in node) - sadly, *environment: 'jsdom',* presents new problems

# bugs
    - elastic collisions (that should be 100% elastic) are not
    - in theory a body can move at above c so introduce a limit we shall
    - when Display Vectors is active, the displayed vectors for a given body are actually the vectors from the previous tick.
        - for a given simulationState, immediately calculate force/acceleration rather than calculating it when advancing to the next tick
    - add small epsilon for Vector2d.lineIntersection()

# feets/refactors/improvements:
- use pointer events instead of mouse&touch
- move with middle mouse, select bodies with right (secondary) mouse
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
