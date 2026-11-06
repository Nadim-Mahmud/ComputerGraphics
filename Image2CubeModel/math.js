// =====================================================================
//  4x4 matrix helpers
// =====================================================================
// A 4x4 matrix can move, scale, or rotate points. WebGL stores matrices
// as 16 numbers in "column-major" order: the first 4 numbers are the
// first COLUMN, not the first row. That's why the translation (x, y, z)
// appears in the last 4 numbers below.

// 3D transform: translation.
function translation(x, y, z) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1,
  ];
}

// 3D transform: scaling.
function scaling(sx, sy, sz) {
  return [
    sx, 0,  0,  0,
    0,  sy, 0,  0,
    0,  0,  sz, 0,
    0,  0,  0,  1,
  ];
}

// 3D transform: rotations (angles in radians).
function rotationX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [1, 0, 0, 0,  0, c, s, 0,  0, -s, c, 0,  0, 0, 0, 1];
}
function rotationY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, 0, -s, 0,  0, 1, 0, 0,  s, 0, c, 0,  0, 0, 0, 1];
}
function rotationZ(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, s, 0, 0,  -s, c, 0, 0,  0, 0, 1, 0,  0, 0, 0, 1];
}

// Multiply two matrices: the result does b first, then a.
function multiply(a, b) {
  const result = new Array(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 4; k++) {
        result[col * 4 + row] += a[k * 4 + row] * b[col * 4 + k];
      }
    }
  }
  return result;
}

// Scale first, then rotate (about z, then x, then y), then translate.
//   rotation = [rx, ry, rz] in radians
function transform(position, rotation, scale) {
  let m = scaling(scale[0], scale[1], scale[2]);
  m = multiply(rotationZ(rotation[2]), m);
  m = multiply(rotationX(rotation[0]), m);
  m = multiply(rotationY(rotation[1]), m);
  return multiply(translation(position[0], position[1], position[2]), m);
}

// Perspective projection: makes far-away objects look smaller.
//   fieldOfView - how wide the camera sees, in radians
//   aspect      - canvas width / height, so things aren't stretched
//   near, far   - nothing closer than near or farther than far is drawn
function perspective(fieldOfView, aspect, near, far) {
  const f = 1 / Math.tan(fieldOfView / 2);
  return [
    f / aspect, 0, 0,                               0,
    0,          f, 0,                               0,
    0,          0, (far + near) / (near - far),    -1,
    0,          0, (2 * far * near) / (near - far), 0,
  ];
}

// Camera matrix: place a camera at `eye`, looking at `target`.
// `up` says which way is "up" for the camera (normally +y).
function lookAt(eye, target, up) {
  const subtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const normalize = (a) => {
    const length = Math.hypot(a[0], a[1], a[2]);
    return [a[0] / length, a[1] / length, a[2] / length];
  };

  // Build the camera's own three axes:
  const zAxis = normalize(subtract(eye, target)); // points backward, away from what we look at
  const xAxis = normalize(cross(up, zAxis));      // points to the camera's right
  const yAxis = cross(zAxis, xAxis);              // points to the camera's up

  return [
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
  ];
}
