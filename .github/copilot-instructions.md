Repository: Gravity — 2D gravity simulation (TypeScript + Vite)

Purpose
- Help an AI agent make safe, focused changes to this small frontend physics simulation. The codebase is intentionally simple: a pure simulation engine (physics) and a separate canvas/view layer that renders and drives interaction.

Top-level developer commands
- Install: run `npm install`.
- Dev server: `npm run dev` (starts Vite). Use this to quickly preview UI changes.
- Build: `npm run build` (Vite build). Preview the production build with `npm run serve`.
- Tests: `npm run test` (runs Vitest). Tests live under `src/tests`.

Big-picture architecture (what to read first)
- src/scripts/gravity.ts — Simulation core. Contains `Body2d` and `Simulation` classes. All physics (forces, collisions, merging, state updates) is here and should be treated as the authoritative model.
- src/scripts/vector2d.ts — Small vector math library used everywhere (distance, add, scale, normalize). Prefer reusing it for new geometry/math.
- src/scripts/canvas.ts — Canvas utilities: drawing, viewport transforms, zoom/scroll helpers and rendering code.
- src/scripts/sandbox.ts — Glue that runs the simulation loop and connects `Simulation` -> `canvas` animation and user actions.
- src/scripts/main.ts — App-level wiring and UI event listeners (buttons, inputs). Edit here only when changing UI behavior or control wiring.

Why things are separated
- Physics is decoupled from rendering: `Simulation` exposes a state array `ObjectState[]` (see `src/scripts/types.ts`). Rendering code reads that state and draws; it should not change physics logic unless intentionally modifying rules.

Project-specific patterns and conventions
- Single-source-of-truth state: `Simulation.simulationState` is the canonical list of objects. Modify state via `Simulation` methods (e.g. `addObject`, `reset`) rather than mutating arrays elsewhere.
- Vector operations: always use `Vector2D` methods (e.g. `.add()`, `.scale()`, `.distance()`) rather than manual arithmetic to stay consistent and avoid mistakes.
- Collision policy: collisions are optional (flag `collisionDetection`) and merging behavior is used by default; elastic collisions are a separate mode (`elasticCollisions`). When changing collision logic, update both `handleCollisions` and tests in `src/tests`.
- Immutability: many methods directly update `ObjectState` instances (in-place). Tests and code assume this pattern — don't convert to immutable updates unless you update all call sites.

Where changes likely belong (examples)
- Change physics rules (gravity constant, force math): edit `src/scripts/gravity.ts` (`Simulation.calculateForceBetweenBodies`, `g` getter/setter).
- Add drawing of a new debug metric (e.g., kinetic energy): implement calculation in `gravity.ts` (helper) and call from `sandbox.ts`/`canvas.ts` for rendering.
- Add UI control that toggles a Simulation flag: add input in HTML and wire in `main.ts` to call `simulation.collisionDetection = ...`.

Tests and quick checks
- Unit tests run via Vitest. Tests live in `src/tests` (e.g. `gravity.spec.ts`, `vector2d.spec.ts`). Run `npm run test` locally. Tests expect Node environment and `tsconfig.json` + `vitest.config.ts` defaults.

Style and quality
- TypeScript strict mode is enabled (`tsconfig.json.strict = true`). Preserve types and prefer small, focused changes with corresponding type updates.
- Avoid changing public APIs (method names/signatures) without updating all call sites. Use the repo-wide search for usages.

Safety notes for automated edits
- Do not change `index.html` layout or deploy scripts unless requested — UI layout is minimal and may break the app.
- Preserve numeric behavior: physics is sensitive to small changes. When adjusting constants or timestep (`Simulation.tickLength`), run the dev server and visually confirm expected behavior.

Files to reference in pull requests
- `src/scripts/gravity.ts`, `src/scripts/vector2d.ts`, `src/scripts/canvas.ts`, `src/scripts/sandbox.ts`, `src/scripts/main.ts`, `src/scripts/types.ts`, `src/tests/*`.

If you need clarification
- Ask what outcome the user wants (visual change, new physics, UI control, test) before making large changes.

End of file
