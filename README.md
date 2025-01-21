# Gravity
This is a 2d-gravity simulation. It is mainly a learning opportunity and coding challenge.
The most recent build can be played with on github pages [here](https://oneusernameplease.github.io/gravity/) (it looks awful on small screens though).
Here is a hopefully complete list of what it can do:
 - Play/Pause/Reset the simulation
 - When the simulation is paused, advance to the next tick via the "Next Step" button.
 - Add bodies to the simulation by clicking on the canvas (make sure "Add" is selected under "Click Action"). Click, drag and release to give the body an initial velocity.
 A body's mass is set in the "Mass" input.
 A body can be set to be either movable or immovable.
 - You can scroll and zoom the view of the simulation, but you have to use the controls in the sidebar.
 - Toggle the display of acceleration and velocity-vectors.
 - Collisions: By default, bodies do not collide. Collisions can be activated in the sidebar. If collisions are activated bodies will merge once the center of one body is inside the other. Furthermore elastic collisions can be activated, this means bodies will bounce off of each other when they touch, though they will still merge once the center of one body is inside the other.

# Setup Development Environment
(i have not yet tried this, so it might not work the way i think)
1. clone/fork/download the repository.
2. run npm install.
3. that should do it

HINT:
run: "npm run dev" to start the vite dev-server

