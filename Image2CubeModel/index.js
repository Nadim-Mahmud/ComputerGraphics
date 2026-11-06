// =====================================================================
//  A grid of cubes with random colors and random heights, in WebGL
// =====================================================================
//
// THE BIG PICTURE
// ---------------
// WebGL can only draw points, lines and triangles. To draw a cube we
// describe it as 12 triangles (2 per face × 6 faces), hand those
// triangles to the GPU, and then ask the GPU to draw that cube once for
// every cube in our list, each time with a different position, height
// and color.
//
// Every frame of WebGL drawing follows the same basic steps:
//
//   1. SHADERS  - small programs that run on the GPU. The *vertex shader*
//                 decides where each corner (vertex) of a triangle lands
//                 on the screen. The *fragment shader* decides the color
//                 of each pixel inside the triangle.
//   2. BUFFERS  - we copy our vertex data (the corners of the cube) into
//                 GPU memory once, at startup.
//   3. UNIFORMS - values that stay the same for a whole draw call, like
//                 "this cube is red" or "this cube is 3 units tall".
//                 We change them before drawing each cube.
//   4. DRAW     - we tell the GPU "draw 36 vertices as triangles".
//
// The sections below follow that same order.


// ---------------------------------------------------------------------
// 0. Get a WebGL "context" from the <canvas> element in index.html.
//    The context (gl) is the object we use to issue every WebGL command.
// ---------------------------------------------------------------------
const canvas = document.getElementById('c');
const gl = canvas.getContext('webgl');


// ---------------------------------------------------------------------
// 1. SHADERS
//    Shaders are written in GLSL, a C-like language. We store the source
//    code in JavaScript strings, then compile them for the GPU.
//
//    Three kinds of shader variables:
//      attribute - a different value for every vertex (e.g. its position)
//      uniform   - one value shared by every vertex in a draw call
//      varying   - passed from the vertex shader to the fragment shader
// ---------------------------------------------------------------------

const vertexShaderSource = /* glsl */ `
  attribute vec3 aPosition;   // corner position of the cube (model space)
  attribute vec3 aNormal;     // direction the face is pointing

  uniform mat4 uModel;        // moves/scales THIS cube into the world
  uniform mat4 uView;         // where the camera is and where it looks
  uniform mat4 uProjection;   // perspective: far things look smaller

  varying vec3 vNormal;       // handed to the fragment shader

  void main() {
    // Turn the normal the same way the cube is turned. Our cubes are only
    // stretched and moved, never rotated, so this changes nothing here.
    // It would matter if you added rotation.
    vNormal = normalize(mat3(uModel) * aNormal);

    // model -> world -> camera -> screen.
    // Read right to left: first place the cube in the world (uModel),
    // then view it from the camera (uView), then apply perspective (uProjection).
    gl_Position = uProjection * uView * uModel * vec4(aPosition, 1.0);
  }
`;

const fragmentShaderSource = /* glsl */ `
  precision mediump float;    

  uniform vec3 uColor;        // this cube's color 
  varying vec3 vNormal;       

  void main() {

    // Simple lighting so we can tell the faces of a cube apart.
    // The light shines from above and slightly to the side.
    vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.3));
    float brightness = max(dot(vNormal, lightDirection), 0.0);

    // Keep 30% "ambient" light so faces in shadow aren't pure black.
    float light = 0.3 + 0.7 * brightness;

    gl_FragColor = vec4(uColor * light, 1.0);   // 1.0 = fully opaque
  }
`;

// Compile one shader and report any GLSL errors.
function compileShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

// A "program" for the GPU
// is a vertex shader + a fragment shader linked together.
const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShaderSource));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShaderSource));
gl.linkProgram(program);
gl.useProgram(program);



// ---------------------------------------------------------------------
// 2. CUBE GEOMETRY → BUFFER
//
//    WHAT IS A BUFFER?
//    The GPU has its own memory, separate from the memory JavaScript
//    uses. The GPU can't reach into our JavaScript arrays while it
//    draws, so we copy the data over ahead of time. A BUFFER is a block
//    of GPU memory that holds that copy.
//
//    WHAT DOES IT HOLD?
//    Just a long list of numbers. A buffer has no idea what the numbers
//    mean. Here they are the corners (vertices) of a cube: each vertex's
//    position and its normal, packed one vertex after another.
//
//    DETAILS
//    We copy the cube into the buffer ONCE, at startup. After
//    that, every draw call reads straight from GPU memory, so drawing
//    100 cubes (or 100 cubes every frame) never re-sends the triangles.
//
//    Using a buffer takes three steps, all in the code below:
//      1. Put the numbers in a JavaScript array   (cubeVertices)
//      2. Copy that array into a GPU buffer       (createBuffer, bufferData)
//      3. Tell the GPU how to read the numbers    (vertexAttribPointer):
//         "the first 3 numbers of each vertex go to aPosition,
//          the next 3 go to aNormal"
//
//    CUBE details
//    One cube, 1 unit wide, with its bottom at y = 0 (so it sits on the
//    ground). Every cube in the scene reuses this same data;
//    uModel is what makes each one different- it is a 4×4 matrix
//    that takes the one shared cube and places it in the world.
//
//    Each face = 2 triangles = 6 vertices. Each vertex has 6 numbers:
//         x,    y,    z,      nx, ny, nz   (position, then normal)
// ---------------------------------------------------------------------
const cubeVertices = new Float32Array([
  // Front face (normal points toward +z)
  -0.5, 0, 0.5,   0, 0, 1,
   0.5, 0, 0.5,   0, 0, 1,
   0.5, 1, 0.5,   0, 0, 1,
  -0.5, 0, 0.5,   0, 0, 1,
   0.5, 1, 0.5,   0, 0, 1,
  -0.5, 1, 0.5,   0, 0, 1,

  // Back face (-z)
  -0.5, 0, -0.5,  0, 0, -1,
   0.5, 1, -0.5,  0, 0, -1,
   0.5, 0, -0.5,  0, 0, -1,
  -0.5, 0, -0.5,  0, 0, -1,
  -0.5, 1, -0.5,  0, 0, -1,
   0.5, 1, -0.5,  0, 0, -1,

  // Top face (+y)
  -0.5, 1, -0.5,  0, 1, 0,
  -0.5, 1,  0.5,  0, 1, 0,
   0.5, 1,  0.5,  0, 1, 0,
  -0.5, 1, -0.5,  0, 1, 0,
   0.5, 1,  0.5,  0, 1, 0,
   0.5, 1, -0.5,  0, 1, 0,

  // Bottom face (-y)
  -0.5, 0, -0.5,  0, -1, 0,
   0.5, 0,  0.5,  0, -1, 0,
  -0.5, 0,  0.5,  0, -1, 0,
  -0.5, 0, -0.5,  0, -1, 0,
   0.5, 0, -0.5,  0, -1, 0,
   0.5, 0,  0.5,  0, -1, 0,

  // Right face (+x)
   0.5, 0, -0.5,  1, 0, 0,
   0.5, 1, -0.5,  1, 0, 0,
   0.5, 1,  0.5,  1, 0, 0,
   0.5, 0, -0.5,  1, 0, 0,
   0.5, 1,  0.5,  1, 0, 0,
   0.5, 0,  0.5,  1, 0, 0,

  // Left face (-x)
  -0.5, 0, -0.5, -1, 0, 0,
  -0.5, 1,  0.5, -1, 0, 0,
  -0.5, 1, -0.5, -1, 0, 0,
  -0.5, 0, -0.5, -1, 0, 0,
  -0.5, 0,  0.5, -1, 0, 0,
  -0.5, 1,  0.5, -1, 0, 0,
]);

// ---------------------------------------------------------------------
// 2. CUBE MESH
//    Uses cubeVertices above: 6 faces x 2 triangles x 3 vertices = 36
//    vertices, each with a position and a normal. Bottom at y = 0.
// ---------------------------------------------------------------------
const VERTEX_COUNT = 36;
const BYTES_PER_FLOAT = 4;
const stride = 6 * BYTES_PER_FLOAT;

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);

const aPosition = gl.getAttribLocation(program, 'aPosition');
gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);

const aNormal = gl.getAttribLocation(program, 'aNormal');
gl.enableVertexAttribArray(aNormal);
gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, stride, 3 * BYTES_PER_FLOAT);

const uModel = gl.getUniformLocation(program, 'uModel');
const uView = gl.getUniformLocation(program, 'uView');
const uProjection = gl.getUniformLocation(program, 'uProjection');
const uColor = gl.getUniformLocation(program, 'uColor');


// ---------------------------------------------------------------------
// 2b. LEVEL 1: LANDSCAPE PROGRAM
//     ONE cube mesh is drawn GRID_SIZE x GRID_SIZE times with instancing.
//     Each instance carries: x, height, z, RGB color.
//       (a) translation: vertex shader moves each cube to its grid cell (x, z)
//       (b) scaling:     vertex shader stretches each cube along y by its height
//       (c) vertex colors: one color per cube, plus a per-corner brightness
//           tweak. Fragment shader interpolates them.
// ---------------------------------------------------------------------
const landscapeVertexSource = /* glsl */  `
  attribute vec3 aPosition;     // cube corner, centered on origin (-0.5..0.5)
  attribute vec3 aNormal;
  attribute vec3 aOffset;       // per cube: x, height, z
  attribute vec3 aColor;        // per cube

  uniform mat4 uView;
  uniform mat4 uProjection;
  uniform float uTime;         // seconds, for the water ripple
  uniform float uWaterLevel;   // cubes shorter than this are water (0 = none)
  uniform float uCellSize;     // cube width/depth = WORLD_SIZE / gridSize
  uniform float uCornerBlend;  // 1 = per-corner colors (level 1), 0 = flat image colors

  varying vec3 vNormal;
  varying vec3 vColor;

  // Cheap pseudo-random number from a 2D position (0..1).
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    // Cube already goes y: 0..1; scale stretches it up by height.
    // Ripple: water cubes get a small moving height change (scaling again).
    float h = aOffset.y;
    float wave = 0.0;

    if (h < uWaterLevel) {
      // Circular rings: wave depends on distance from the center (0,0),
      // and moves inward (toward the island) as time grows.

      float dist = length(aOffset.xz);
      float noise = hash(aOffset.xz);   // fixed random 0..1 per cube

      // Big slow rings (shifted a little by noise) + small fast ripples.
      wave = 0.7 * sin(dist * 0.14 + uTime * 1.35 + noise * 1.5)
           + 0.3 * sin(dist * 0.5 + uTime * 2.5 + noise * 6.28);
      h += 0.5 + 0.3 * wave;     // always > 0
    }
    mat4 scale = mat4(
      vec4(uCellSize, 0.0, 0.0, 0.0),
      vec4(0.0, h, 0.0, 0.0),
      vec4(0.0, 0.0, uCellSize, 0.0),
      vec4(0.0, 0.0, 0.0, 1.0));

    mat4 translate = mat4(
      vec4(1.0, 0.0, 0.0, 0.0),
      vec4(0.0, 1.0, 0.0, 0.0),
      vec4(0.0, 0.0, 1.0, 0.0),
      vec4(aOffset.x, 0.0, aOffset.z, 1.0));

    vec3 local = aPosition;   // cubeVertices already go y: 0..1

    // Vertex color: the cube's color, each corner a bit different.
    // Level 1c: each of the 8 corners gets its own color, made from the
    // cube's color by swapping channels (gbr / brg). Colors are assigned per
    // vertex; the rasterizer interpolates them across every face.
    vec3 c = vec3(aPosition.x + 0.5, aPosition.y, aPosition.z + 0.5);   // 0 or 1 per axis
    vec3 cornerColor = mix(
      mix(aColor, aColor.gbr, c.x),
      mix(aColor.brg, aColor, c.z),
      0.25 + 0.5 * c.y);
    vec3 baseColor = mix(aColor, cornerColor, uCornerBlend);
    float corner = (c.x + c.z) * 0.5;   // 0..1
    vColor = baseColor * (0.75 + 0.5 * corner) * (1.0 + 0.15 * wave);

    vNormal = aNormal;   // only axis-aligned scale/translate: normals unchanged

    gl_Position = uProjection * uView * translate * scale * vec4(local, 1.0);
  }
`;

const landscapeFragmentSource =  /* glsl */`
  precision mediump float;
  uniform float uBrightness;   // overall multiplier, changed with +/- keys
  varying vec3 vNormal;
  varying vec3 vColor;   // interpolated between the triangle's 3 vertices

  void main() {
    vec3 lightDirection = normalize(vec3(0.5, 1.0, 0.3));
    float light = 0.6 + 0.4 * max(dot(normalize(vNormal), lightDirection), 0.0);
    gl_FragColor = vec4(clamp(vColor * light * uBrightness, 0.0, 1.0), 1.0);
  }
`;

const landscapeProgram = gl.createProgram();
gl.attachShader(landscapeProgram, compileShader(gl.VERTEX_SHADER, landscapeVertexSource));
gl.attachShader(landscapeProgram, compileShader(gl.FRAGMENT_SHADER, landscapeFragmentSource));
gl.linkProgram(landscapeProgram);

if (!gl.getProgramParameter(landscapeProgram, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(landscapeProgram));
}

const instancing = gl.getExtension('ANGLE_instanced_arrays');

// Per-instance data: x, height, z, rgb  (6 floats)
const FLOATS_PER_CUBE = 6;

const gridSize = GRID_SIZE;
const cellSize = () => WORLD_SIZE / gridSize;   // distance between cube centers = cube width

function createInstanceBuffer(data) {
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  return buf;
}
// Cube data per level: { buffer, count }. Level 2 is filled after images load.
const levelCubes = {};

// Replace a level's cube data and free the old GPU buffer.
function setLevelCubes(level, data) {
  if (levelCubes[level]) gl.deleteBuffer(levelCubes[level].buffer);
  levelCubes[level] = { buffer: createInstanceBuffer(data), count: gridSize * gridSize };
}

// Level 1: random heights and colors.
function buildLevel1() {
  const data = new Float32Array(gridSize * gridSize * FLOATS_PER_CUBE);
  const cell = cellSize();

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const height = MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT);
      const color = [Math.random(), Math.random(), Math.random()];

      data.set([
        (col - (gridSize - 1) / 2) * cell, height,
        (row - (gridSize - 1) / 2) * cell,
        ...color,
      ], (row * gridSize + col) * FLOATS_PER_CUBE);
    }
  }

  setLevelCubes(1, data);
}

buildLevel1();

const landscapeLoc = {
  position: gl.getAttribLocation(landscapeProgram, 'aPosition'),
  normal: gl.getAttribLocation(landscapeProgram, 'aNormal'),
  offset: gl.getAttribLocation(landscapeProgram, 'aOffset'),
  color: gl.getAttribLocation(landscapeProgram, 'aColor'),
  view: gl.getUniformLocation(landscapeProgram, 'uView'),
  projection: gl.getUniformLocation(landscapeProgram, 'uProjection'),
  brightness: gl.getUniformLocation(landscapeProgram, 'uBrightness'),
  time: gl.getUniformLocation(landscapeProgram, 'uTime'),
  waterLevel: gl.getUniformLocation(landscapeProgram, 'uWaterLevel'),
  cellSize: gl.getUniformLocation(landscapeProgram, 'uCellSize'),
  cornerBlend: gl.getUniformLocation(landscapeProgram, 'uCornerBlend'),
};

// Attribute state is global, not per program, so reset it before each level.
function resetAttributes() {
  for (let i = 0; i < 8; i++) {
    gl.disableVertexAttribArray(i);
    if (instancing) instancing.vertexAttribDivisorANGLE(i, 0);
  }
}

function useCubeProgram() {
  resetAttributes();
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(aNormal);
  gl.vertexAttribPointer(aNormal, 3, gl.FLOAT, false, stride, 3 * BYTES_PER_FLOAT);
}

function useLandscapeProgram(instanceBuffer) {
  resetAttributes();
  gl.useProgram(landscapeProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(landscapeLoc.position);
  gl.vertexAttribPointer(landscapeLoc.position, 3, gl.FLOAT, false, stride, 0);
  gl.enableVertexAttribArray(landscapeLoc.normal);
  gl.vertexAttribPointer(landscapeLoc.normal, 3, gl.FLOAT, false, stride, 3 * BYTES_PER_FLOAT);

  gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer);
  const instStride = FLOATS_PER_CUBE * BYTES_PER_FLOAT;

  [[landscapeLoc.offset, 0], [landscapeLoc.color, 3]]
    .forEach(([loc, floatOffset]) => {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, instStride, floatOffset * BYTES_PER_FLOAT);
      instancing.vertexAttribDivisorANGLE(loc, 1);   // advance once per cube
    });
}



function loadImagePixels(url) {

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';   
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;

      const ctx = c.getContext('2d', { willReadFrequently: true });

      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, c.width, c.height));
    };

    img.onerror = () => reject(new Error('Could not load ' + url));
    img.src = url;
  });
}

// Average RGB of the source rectangle that grid cell (col,row) covers.
function sampleCell(image, col, row) {
  const x0 = Math.floor(col * image.width / gridSize);
  const x1 = Math.max(x0 + 1, Math.floor((col + 1) * image.width / gridSize));
  const y0 = Math.floor(row * image.height / gridSize);
  const y1 = Math.max(y0 + 1, Math.floor((row + 1) * image.height / gridSize));

  let r = 0, g = 0, b = 0, n = 0;

  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * image.width + x) * 4;
      r += image.data[i]; 
      g += image.data[i + 1]; 
      b += image.data[i + 2];

      n++;
    }
  }

  return [r / n / 255, g / n / 255, b / n / 255];
}

// Decoded pixels are kept so changing gridSize resamples without reloading.
const level2Images = { color: null, height: null };

function buildLevel2() {
  const data = new Float32Array(gridSize * gridSize * FLOATS_PER_CUBE);
  const cell = cellSize();

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {

      const color = sampleCell(level2Images.color, col, row);
      const gray = sampleCell(level2Images.height, col, row)[0];   // 0..1

      const height = L2_MIN_HEIGHT + gray * (L2_MAX_HEIGHT - L2_MIN_HEIGHT);
      data.set([
        (col - (gridSize - 1) / 2) * cell, height,
        (row - (gridSize - 1) / 2) * cell,
        ...color,
      ], (row * gridSize + col) * FLOATS_PER_CUBE);
    }
  }

  setLevelCubes(2, data);
}

// load only once
let level2Status = 'idle';   // idle | loading | ready | error

async function loadLevel2() {
  if (level2Status !== 'idle') return;

  level2Status = 'loading';
  setLevelInfo();

  try {
    [level2Images.color, level2Images.height] = await Promise.all([
      loadImagePixels(COLOR_IMAGE_URL), loadImagePixels(HEIGHT_IMAGE_URL)]);
      
    buildLevel2();
    level2Status = 'ready';
  } catch (err) {
    console.error(err);
    level2Status = 'error';
  }

  setLevelInfo();
  draw();
}


const helpButton = document.getElementById('help-button');
const helpDialog = document.getElementById('camera-help');

helpButton.addEventListener('click', () => {
  helpDialog.showModal();
  helpButton.setAttribute('aria-expanded', 'true');
});

document.getElementById('close-help').addEventListener('click', () => helpDialog.close());
helpDialog.addEventListener('close', () => {
  helpButton.setAttribute('aria-expanded', 'false');
  helpButton.focus({ preventScroll: true });
});

helpDialog.addEventListener('click', (event) => {
  if (event.target !== helpDialog) return;
  const bounds = helpDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) {
    helpDialog.close();
  }
});



const LEVEL_INFO = {
  0: 'Level 0 · Project preliminaries.',
  1: 'Level 1 · Procedural cube landscape.',
  2: 'Level 2 · Cube landscape from image data.',
  3: 'Level 3 · Skyscape, made out of cubes.',
  4: 'Level 4 · Skyscape with rippling sea.',
};

let currentLevel = 0;
const levelButtons = document.querySelectorAll('.level-button');

function setLevelInfo() {
  let text = LEVEL_INFO[currentLevel];
  document.getElementById('level-info').textContent = text;
}

function setLevel(level) {
  currentLevel = level;

  levelButtons.forEach((button) => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.level) === level));
  });
  
  setLevelInfo();
  
  if (level >= 2) loadLevel2();
  if (level >= 3 && !skyLoopRunning) { skyLoopRunning = true; requestAnimationFrame(skyLoop); }
  
  draw();
}

let orbitAngle = Math.PI / 2;      // radians around the y axis
let orbitRadius = ORBIT_RADIUS;    // horizontal distance from look-at point
let orbitHeight = ORBIT_HEIGHT;    // height above the look-at point
// Zoom: move the camera toward (factor < 1) or away from (factor > 1) the
// look-at point, keeping the same viewing angle.

function zoom(factor) {
  if (currentLevel < 1) return;
  const next = Math.min(MAX_ORBIT_RADIUS, Math.max(MIN_ORBIT_RADIUS, orbitRadius * factor));
  orbitHeight *= next / orbitRadius;
  orbitRadius = next;

  draw();
}

document.getElementById('zoom-in').addEventListener('click', () => zoom(ZOOM_FACTOR));
document.getElementById('zoom-out').addEventListener('click', () => zoom(1 / ZOOM_FACTOR));
canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  zoom(event.deltaY < 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR);
}, { passive: false });

let brightness = BRIGHTNESS;       // landscape brightness multiplier
levelButtons.forEach((button) => {
  button.addEventListener('click', () => setLevel(Number(button.dataset.level)));
});



//  Camera movement: arrow keys move the camera forward/backward and sideways, but not up/down. The camera always looks at the cube at the origin. The camera is prevented from moving through the cube by stopping just before it.

const cameraPosition = [...CAMERA_POSITION];

window.addEventListener('keydown', (event) => {
  if (helpDialog.open || event.altKey || event.ctrlKey || event.metaKey) return;

  // Level 1: left/right orbit around the look-at point, up/down zoom.
  if (currentLevel >= 1) {
    switch (event.key) {
      case 'ArrowLeft': orbitAngle -= ORBIT_STEP; break;
      case 'ArrowRight': orbitAngle += ORBIT_STEP; break;
      case 'ArrowUp': orbitRadius = Math.max(MIN_ORBIT_RADIUS, orbitRadius - ZOOM_STEP); break;
      case 'ArrowDown': orbitRadius = Math.min(MAX_ORBIT_RADIUS, orbitRadius + ZOOM_STEP); break;
      case '+': case '=': brightness = Math.min(4, brightness + BRIGHTNESS_STEP); break;
      case '-': case '_': brightness = Math.max(0.2, brightness - BRIGHTNESS_STEP); break;
      default: return;
    }
    event.preventDefault();
    draw();
    return;
  }
  if (currentLevel !== 0) return;

  let sideways = 0;
  let forward = 0;
  switch (event.key) {
    case 'ArrowLeft': sideways = -1; break;
    case 'ArrowRight': sideways = 1; break;
    case 'ArrowUp': forward = 1; break;
    case 'ArrowDown': forward = -1; break;
    default: return;
  }

  event.preventDefault();

  const dx = CAMERA_TARGET[0] - cameraPosition[0];
  const dz = CAMERA_TARGET[2] - cameraPosition[2];
  const distance = Math.hypot(dx, dz);
  if (distance < 0.0001) return;
  const forwardX = dx / distance;
  const forwardZ = dz / distance;

  // Try the full step; if it would take the camera too close to the cube
  // (inside it, or so close that it fills the window), shorten the step.
  let step = CAMERA_MOVE_STEP;
  while (step > 0.001) {
    const x = cameraPosition[0] + (forward * forwardX - sideways * forwardZ) * step;
    const z = cameraPosition[2] + (forward * forwardZ + sideways * forwardX) * step;
    const farEnough = Math.hypot(x, cameraPosition[1] - cubeCenterY, z) >= minCameraDistance;
    const keepsDistance = forward <= 0 || distance - step >= 0.1;
    if (farEnough && keepsDistance) {
      cameraPosition[0] = x;
      cameraPosition[2] = z;
      break;
    }
    step /= 2;
  }
  draw();
});


// The cube must never fill or leave the window (that makes it flicker as it
// crosses the camera's near plane). Keep a sphere around the cube inside
// the view: its radius is half the cube's diagonal.
const SPHERE_PER_SIZE = Math.sqrt(3) / 2;
const VIEW_MARGIN = 0.9;
let cubeCenterY = CUBE_SIZE / 2;
let minCameraDistance = 0;

// Largest cube size that fits in the window from the starting camera.
function fitCubeSize(halfAngle) {
  let low = 0.01;
  let high = CUBE_SIZE;
  const fits = (size) => {
    const distance = Math.hypot(
      CAMERA_POSITION[0], CAMERA_POSITION[1] - size / 2, CAMERA_POSITION[2]);
    return size * SPHERE_PER_SIZE <= distance * Math.sin(halfAngle) * VIEW_MARGIN;
  };
  if (fits(high)) return high;
  for (let i = 0; i < 30; i++) {
    const middle = (low + high) / 2;
    if (fits(middle)) low = middle; else high = middle;
  }
  return low;
}

function drawLandscape(now, aspect, cubes = levelCubes[currentLevel]) {
  if (!cubes) return;   // level 2 images still loading
  useLandscapeProgram(cubes.buffer);
  gl.uniform1f(landscapeLoc.brightness, brightness);
  gl.uniform1f(landscapeLoc.cellSize, cellSize());
  gl.uniform1f(landscapeLoc.cornerBlend, currentLevel === 1 ? 1 : 0);
  gl.uniform1f(landscapeLoc.time, now / 1000);
  gl.uniform1f(landscapeLoc.waterLevel, currentLevel === 4 ? WATER_LEVEL : 0);
  const fov = aspect < 1
    ? 2 * Math.atan(Math.tan(L1_FIELD_OF_VIEW / 2) / aspect)
    : L1_FIELD_OF_VIEW;
  gl.uniformMatrix4fv(landscapeLoc.projection, false,
    perspective(fov, aspect, L1_NEAR_CLIP, L1_FAR_CLIP));

  // Camera path: circle around the look-at point, always facing it.
  const eye = [
    LOOK_AT_POINT[0] + orbitRadius * Math.cos(orbitAngle),
    LOOK_AT_POINT[1] + orbitHeight,
    LOOK_AT_POINT[2] + orbitRadius * Math.sin(orbitAngle),
  ];
  gl.uniformMatrix4fv(landscapeLoc.view, false, lookAt(eye, LOOK_AT_POINT, CAMERA_UP));

  instancing.drawArraysInstancedANGLE(gl.TRIANGLES, 0, VERTEX_COUNT, cubes.count);
}

// ---------------------------------------------------------------------
// LEVEL 3: SKY MADE OF CUBES
//   Each cloud = 2 white cubes (puffs). Every puff is
//     scaled (flattened box), rotated (random yaw), translated (offset in cloud)
//   by transform() in math.js. The whole cloud is then translated again to
//   its position in the sky.
//
//   BEZIER PATH (every cloud moves):
//   Cubic Bezier curve with 4 control points P0..P3:
//       B(t) = (1-t)^3 P0 + 3(1-t)^2 t P1 + 3(1-t) t^2 P2 + t^3 P3,  t in [0,1]
//   The curve starts at P0, ends at P3, and is only pulled toward (never
//   through) P1 and P2, so moving the middle points bends the path.
//   t goes 0 -> 1 -> 0 (ping-pong), so the cloud drifts back and forth with
//   no jump. Cubic was chosen because it is the simplest curve that can make
//   an S-shaped path in 3D.
// ---------------------------------------------------------------------
function bezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [0, 1, 2].map((k) =>
    u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]);
}

const rand = (a, b) => a + Math.random() * (b - a);

const PUFFS_PER_CLOUD = 4;
const CLOUD_COUNT = 3;

function makeCloud() {
  const puffs = [];
  for (let i = 0; i < PUFFS_PER_CLOUD; i++) {
    puffs.push({
      offset: [rand(-8, 8), rand(-2, 2), rand(-5, 5)],
      rotation: [0, rand(0, Math.PI), 0],
      scale: [rand(8, 14), rand(4, 7), rand(6, 10)],
    });
  }

  const point = () => [rand(-110, 110), rand(75, 100), rand(-110, 110)];
  return { puffs, path: [point(), point(), point(), point()], speed: rand(0.02, 0.05) };
}
const clouds = [];
for (let i = 0; i < CLOUD_COUNT; i++) clouds.push(makeCloud());   // every cloud moves

let skyLoopRunning = false;

function skyLoop(now) {
  if (currentLevel < 3) { skyLoopRunning = false; return; }
  draw(now);

  requestAnimationFrame(skyLoop);
}

function drawSky(now, aspect) {
  // The island (level 2 data) first, then the clouds on top of it.
  if (levelCubes[2]) drawLandscape(now, aspect, levelCubes[2]);
  useCubeProgram();

  gl.uniformMatrix4fv(uProjection, false,
    perspective(L1_FIELD_OF_VIEW, aspect, L1_NEAR_CLIP, L1_FAR_CLIP));
  
    const eye = [
    LOOK_AT_POINT[0] + orbitRadius * Math.cos(orbitAngle),
    LOOK_AT_POINT[1] + orbitHeight,
    LOOK_AT_POINT[2] + orbitRadius * Math.sin(orbitAngle),
  ];

  gl.uniformMatrix4fv(uView, false, lookAt(eye, LOOK_AT_POINT, CAMERA_UP));

  const seconds = now / 1000;
  for (const cloud of clouds) {
    const phase = (seconds * cloud.speed) % 2;              // 0..2
    const t = phase < 1 ? phase : 2 - phase;                // ping-pong 0..1..0
    const position = bezier(...cloud.path, t);

    for (const puff of cloud.puffs) {
      const puffMatrix = transform(puff.offset, puff.rotation, puff.scale);
      const model = multiply(translation(...position), puffMatrix);
      gl.uniformMatrix4fv(uModel, false, model);
      gl.uniform3fv(uColor, [1, 1, 1]);
      gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
    }
  }
}

function draw(now = performance.now()) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
  canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(...BACKGROUND_COLOR);
  gl.enable(gl.DEPTH_TEST);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const aspect = canvas.width / canvas.height;

  if (currentLevel === 1 || currentLevel === 2) {
    drawLandscape(now, aspect);
    return;
  }
  if (currentLevel >= 3) {
    drawSky(now, aspect);
    return;
  }

  // Keep enough horizontal room on narrow windows as well.
  const verticalFieldOfView = aspect < 1
    ? 2 * Math.atan(Math.tan(FIELD_OF_VIEW / 2) / aspect)
    : FIELD_OF_VIEW;
  useCubeProgram();
  gl.uniformMatrix4fv(uProjection, false,
    perspective(verticalFieldOfView, aspect, NEAR_CLIP, FAR_CLIP));

  // Clamp the cube so it stays inside the window, and keep the camera
  // from getting close enough to leave the window or enter the cube.
  const halfVertical = verticalFieldOfView / 2;
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * aspect);
  const halfAngle = Math.min(halfVertical, halfHorizontal);
  const cubeSize = fitCubeSize(halfAngle);
  cubeCenterY = cubeSize / 2;
  minCameraDistance = (cubeSize * SPHERE_PER_SIZE) / Math.sin(halfAngle);

  const target = [CAMERA_TARGET[0], cubeCenterY, CAMERA_TARGET[2]];
  gl.uniformMatrix4fv(uView, false, lookAt(cameraPosition, target, CAMERA_UP));

  if (currentLevel !== 0) return; // Levels 2-3 have nothing to draw yet.

  // Scale the unit cube (its bottom is already at y = 0).
  const model = multiply(
    translation(0, 0, 0),   // cubeVertices already sit on y = 0
    scaling(cubeSize, cubeSize, cubeSize),
  );

  gl.uniformMatrix4fv(uModel, false, model);
  gl.uniform3fv(uColor, CUBE_COLOR);
  gl.drawArrays(gl.TRIANGLES, 0, VERTEX_COUNT);
}

setLevel(0);
window.addEventListener('resize', () => draw());
