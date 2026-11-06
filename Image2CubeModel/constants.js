// Change these values, save, and refresh the page.

// Level 0: one 2 x 2 x 2 cube.
const CUBE_SIZE = 2;
const CUBE_COLOR = [0.3, 0.65, 0.95];

// Background: [red, green, blue, alpha], each from 0 to 1.
const BACKGROUND_COLOR = [0, 0, 0, 1];

// Camera
const FIELD_OF_VIEW = Math.PI / 4; // Radians.
const NEAR_CLIP = 0.1;
const FAR_CLIP = 100;
const CAMERA_POSITION = [3.6, 3.2, 5.4];
const CAMERA_TARGET = [0, 1, 0];
const CAMERA_UP = [0, 1, 0];
const CAMERA_MOVE_STEP = 0.25; // Distance moved for each arrow-key press/repeat.

// Level 1: procedural landscape.
const GRID_SIZE = 200;          // Starting cube count per side: GRID_SIZE x GRID_SIZE.
                                // Controls ALL voxels, including image sampling.
                                // Set once here; refresh the page after changing it.
const WORLD_SIZE = 200;         // Landscape width/depth. Fixed, so more cubes = finer
                                // (smaller) cubes; cell size = WORLD_SIZE / GRID_SIZE.
const MAX_HEIGHT = 40;          // Tallest column.
const MIN_HEIGHT = 0.5;         // Shortest column (never zero-height).
const L1_FIELD_OF_VIEW = Math.PI / 4;
const L1_NEAR_CLIP = 1;
const L1_FAR_CLIP = 1000;
const ORBIT_RADIUS = 260;       // Camera distance from the look-at point (horizontal).
const ORBIT_HEIGHT = 150;       // Camera height above the plane.
const ORBIT_STEP = 0.05;        // Radians per left/right key press.
const ZOOM_FACTOR = 0.9;        // Each zoom-in multiplies the distance by this.
const ZOOM_STEP = 8;            // Distance per up/down key press (height stays the same).
const MIN_ORBIT_RADIUS = 20;
const MAX_ORBIT_RADIUS = 600;
const LOOK_AT_POINT = [0, 0, 0];

// Level 2: landscape from images (paths are relative to index.html, so they
// work from a local server and from GitHub Pages).
const COLOR_IMAGE_URL = 'assets/saba_color.png';
const HEIGHT_IMAGE_URL = 'assets/saba_height.png';
const L2_MIN_HEIGHT = 0.5;      // Height for gray value 0.
const L2_MAX_HEIGHT = 60;       // Height for gray value 255.

// Landscape brightness (levels 1-2). Press + / - to change it live.
const BRIGHTNESS = 1.6;         // 1 = original, higher = brighter.
const BRIGHTNESS_STEP = 0.1;

// Water ripple (levels 2-3): cubes shorter than this are treated as water.
const WATER_LEVEL = 1.5;
