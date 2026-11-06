# WebGL Camera Orbit: Summary

## Goal

This is a minimal teaching example for an intro computer graphics course. A
camera slowly orbits a small, still 3D scene. The code is plain WebGL with no
libraries, no build step, and no frameworks. Every line is commented so that
students who are new to WebGL can follow along.

## How to run

Open `index.html` in any modern web browser. Double-clicking it is enough,
because no web server is needed.

## Files

| File         | Purpose |
|--------------|---------|
| `index.html` | The page. It holds a full-window `<canvas>` and loads `index.js`. |
| `index.js`   | All the WebGL code: shaders, geometry, matrix math, and the animation loop. |
| `SUMMARY.md` | This document. |

(`package.json` and `.idea/` came from the editor's project template. The
example doesn't use them.)

## What the scene contains

- A **floor**: a wide, thin, gray box.
- A **tall red tower** in the center.
- **Three smaller boxes** (blue, green, and yellow) placed around the tower.

Every object is the **same unit cube**, uploaded to the GPU once. Each object
just uses a different *model matrix* (position and scale) and a different
color. This shows students that one piece of geometry can be reused many times.

Each cube face has a fixed brightness, called its "shade", so the boxes look 3D
without real lighting. Lighting is left out on purpose so the example stays
focused on the camera.

## How `index.js` is organized (7 steps)

1. **Get a WebGL context** from the canvas.
2. **Shaders.** A vertex shader computes
   `projection * view * model * position`. A fragment shader outputs the
   object's color multiplied by the face's shade. The comments explain what
   `attribute`, `uniform`, and `varying` mean.
3. **Compile and link** the shaders into a program, and look up the location
   of each variable.
4. **Cube geometry.** The 36 vertices (6 faces × 2 triangles × 3 vertices)
   are written out explicitly and uploaded into GPU buffers.
5. **Scene description.** A simple array lists each object's position, scale,
   and color.
6. **Matrix math, written by hand:**
   - `makeModelMatrix` builds scale and translation.
   - `lookAt(eye, target, up)` builds the **view matrix**, which is the camera
     itself. The comments explain that moving the camera is the same as moving
     the whole world the opposite way.
   - `perspective(fov, aspect, near, far)` builds the **projection matrix**,
     which acts as the camera's lens.
   - The comments also explain column-major storage.
7. **Animation loop** (`requestAnimationFrame`). Each frame:
   - Compute the camera position on a circle:
     `eye = (R·cos θ, height, R·sin θ)`, where θ grows with time.
   - Build the view matrix with `lookAt` so the camera always faces the
     center of the scene.
   - Clear the screen and draw every object.

## Key teaching points

- **The scene never moves; only the view matrix changes.** This is the main
  idea of the example.
- The full chain of coordinate spaces: object → world → camera → clip →
  screen.
- Why the depth test is needed, and why both the color buffer and the depth
  buffer are cleared every frame.
- A canvas has two sizes: its CSS size and its drawing-buffer size. The
  viewport has to match the drawing buffer.

## Easy experiments for students

The constants near the top of Step 7 are the easiest place to start:

- Change `ORBIT_RADIUS`, `ORBIT_HEIGHT`, or `ORBIT_SPEED`.
- Make the height vary over time, for example
  `ORBIT_HEIGHT + 2 * Math.sin(seconds)`, so the camera bobs up and down.
- Change `LOOK_AT` so the camera aims at a different object.
- Change the field of view, for example from 45° to 90° or 20°, to see a
  wide-angle lens versus a zoomed-in lens.
- Add a new object by adding one line to `sceneObjects`.
- Comment out `gl.enable(gl.DEPTH_TEST)` to see what goes wrong without it.

## Self-check quiz (`quiz-selfcheck/`)

A static self-check quiz for this example. It works like the WebGL cube quiz
in `quiz-selfcheck-example/` and uses the same engine. Open
`quiz-selfcheck/index.html` directly in a browser.

- An exploration page shows the whole of `index.js` with its comments
  removed. It is split into 17 colored sections with 131 line notes.
- There are 14 cards in program order: vertex shader, fragment shader,
  compiling and linking, variable locations, cube vertex data, uploading
  buffers, the scene, vector helpers, model matrix, view matrix (lookAt),
  perspective, depth test and canvas size, moving the camera, and drawing one
  frame. Each card has a summary, a self-check, a matching step, and 5
  questions.
- The review list is saved in `localStorage` under `cameraOrbitQuizReview`.
- The code in `cards.js` and `explore-notes.js` is a **copy**. If `index.js`
  changes, update both files by hand. `HOW_TO_MAKE_A_NEW_QUIZ.md` in that
  folder includes the check scripts.

## Status

- [x] `index.html` and `index.js` written and fully commented.
- [x] Tested in Chrome: the scene renders correctly, the camera orbits
      smoothly, and there are no console errors.
- [x] Summary written (this file).

Possible next steps, if wanted: let the user control the camera with the
mouse or keyboard, add lighting with normals, or show orthographic and
perspective projection side by side.
