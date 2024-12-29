# setup Dev Env
(i have not yet tried this, so it might not work the way i think)
1. clone/fork/download (idk the correct term) the repo
2. run npm install.
    this should install typescript and vite.
3. you need my library tcellib-vectors, which is not published on npm, but public on github. download it.

If you then have local access to the vectors-lib, run [npm link] in that directory, and [npm link projectName] in the gravity project dir (projectName = tcellib-vectors).


4. that should do it


run: "npm run dev" to start dev server
[npm link projectName] needs to be rerun after adding packages w/ npm install, bc /node-modules gets replaced and the symlink needs to be reestablished


run "npm run deploy" to redeploy to gh-pages
# gravity

