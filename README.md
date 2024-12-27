# setup Dev Env
(i have not yet tried this, so it might not work the way i think)
1. clone/fork/download (idk the correct term) the repo
2. run npm install.
    this should install typescript and vite.
3. you need my library tcellib-vectors, which is not published on npm, but possibly public on github (if i publish it). otherwise create a Vector2D class w/ properties x and y, and some static methods. Which ones you need can probably be seen in the error messages and or problems section of your IDE.

If you have local access to the vectors-lib, run [npm link] in that directory, and [npm link projectName] in the gravity project dir (projectName = tcellib-vectors).

(I don't know how to set a locally linked project as a dev dependency.)

4. that should do it


run: "npm run dev" to start dev server
[npm link projectName] needs to be rerun after adding packages w/ npm install, bc /node-modules gets replaced and the symlink needs to be reestablished

# gravity

