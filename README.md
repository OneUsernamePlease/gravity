# install dev env
cloning and npm install should do it.
run: "npm run dev" to start dev server
EXCEPT you need my library tcellib-vectors, which is not published on npm nor public on github
    if you have local access to the vectors-lib, run npm link in that directory, and <npm link projectName> in the gravity project dir
    <npm link projectName> needs to be rerun after adding packages w/ npm install, bc node-modules get replaced and the symlink needs to be reestablished

# gravity

