# Gravity
This is a 2d-gravity simulation. It is mainly a learning opportunity and coding challenge.
The most recent build can be played with on github pages [here](https://oneusernameplease.github.io/gravity/) (it looks awful on small screens though).
Here is a hopefully complete list of what it can do:
 - Play/Pause/Reset the simulation
 - When the simulation is paused, advance to the next tick via the "Next Step" button.
 - Add bodies to the simulation by clicking on the canvas. Drag to give the body an initial velocity.
 A body's mass is set in the "Mass" input.
 A body can be set to be either movable or immovable.
 - You can scroll and zoom the simulation, using mouse or touch-gestures.
 - Toggle the display of acceleration and velocity-vectors.
 - Collisions: Collisions can be activated in the sidebar. If collisions are activated, bodies will merge once the center of one body is inside the other. Furthermore elastic collisions can be activated, this means bodies will bounce off of each other when they collide, though they will still merge according to the rule I just specified.
 If collisions are turned off, bodies will not merge, which leads to weird behavior if bodies overlap as forces grow very big at low distances.

# Setup Development Environment
(i have not yet tried this, so it might not work the way i think)
1. clone/fork/download the repository.
2. run npm install.
3. that should do it

HINT:
run: "npm run dev" to start the vite dev-server.

# Code
- main.ts
Entry point. Contains app.ts, which is basically the project.

- app.ts
Combines the UI with the simulation and animation.

- gravity.ts
This contains the Body2d class and the Simulation class. Body2d is pretty self explanatory. Simulation runs the simulation-loop and contains the math and basic interactions for the gravity-simulation (ie. calculate acceleration, velocity, positions, add/remove bodies).

- canvas.ts
This contains the canvas and its context, functions here are just for drawing on the canvas (it knows nothing about the simulation).

- gravity-animation-controller.ts
Combines and coordinates simulation and animation.

- animation-controller.ts
This runs the animation loop. 

- interaction-manager.ts
Has a reference to the canvas-element and contains its EventListeners for mouse- and touch-interactions.

- ui.ts
Contains all UI-controls (but not the canvas).

- types.ts
A collection of interfaces and enums.

- vector2d.ts
A simple vector library.

- transformations.ts
Mainly conversions between Canvas and Simulation.

- essentials.ts
Some generally useful functions.




