
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let WIDTH = 320;
const HEIGHT = 200;

const FPS = 30;

let PIXEL_SIZE = 5;

canvas.width = WIDTH * PIXEL_SIZE;
canvas.height = HEIGHT * PIXEL_SIZE;

let activeButtonId = "btn_cube";

let speed = 0.5;
let maxSpeed = 2;

function showSpeed() {
    document.getElementById("speedInfo").textContent = `Speed: ${speed.toFixed(1)}`;
}

let cubeCamera = {
    x: 0,
    y: 0,
    z: -10
};

const gameCamera = {
    x: 0,
    y: 5,
    z: -10
};


// Reusable functions for 3D projection and drawing wireframes

function project(vertex, camera, viewWidth = canvas.width, viewHeight = canvas.height) {

    const x = vertex.x - camera.x;
    const y = vertex.y - camera.y;
    const z = vertex.z - camera.z;

    // Ignore vertices behind or too close
    // to the camera.
    if (z <= 0.1) {
        return null;
    }

    const u = (x / z) * viewHeight + viewWidth / 2;
    const v = viewHeight / 2 - (y / z) * viewHeight;

    return {
        u: u,
        v: v,
        depth: z
    };
}

function drawLine(u1, v1, u2, v2, color = "#FFFFFF", pixelSize = 1) {

    const du = u2 - u1;
    const dv = v2 - v1;

    const steps = Math.ceil(
        Math.max(Math.abs(du), Math.abs(dv))
    );

    if (steps === 0) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(u1), Math.round(v1), 1, 1);
        return;
    }

    const uStep = du / steps;
    const vStep = dv / steps;

    let u = u1;
    let v = v1;

    ctx.fillStyle = color;

    for (let i = 0; i <= steps; i++) {

        ctx.fillRect(
            Math.round(u),
            Math.round(v),
            pixelSize,
            pixelSize
        );

        u += uStep;
        v += vStep;
    }
}


function drawWireframe(vertices, edges, color, camera) {

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    const pixelMode = activeButtonId === "btn_320x200";
    const viewWidth = pixelMode ? WIDTH : canvas.width;
    const viewHeight = pixelMode ? HEIGHT : canvas.height;

    for (const edge of edges) {

        const p1 = project(
            vertices[edge[0]],
            camera, viewWidth, viewHeight
        );

        const p2 = project(
            vertices[edge[1]],
            camera, viewWidth, viewHeight
        );

        if (p1 === null || p2 === null) {
            continue;
        }

        if (activeButtonId === "btn_320x200") {
            drawLine(
                p1.u * PIXEL_SIZE,
                p1.v * PIXEL_SIZE,
                p2.u * PIXEL_SIZE,
                p2.v * PIXEL_SIZE,
                color,
                PIXEL_SIZE,
            );
        }
        else {
            drawLine(
                p1.u,
                p1.v,
                p2.u,
                p2.v,
                color
            );
        }
    }
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}


//  Level 0:  qube drawing methods

const cubeModel = {

    vertices: [
        { x: 1, y: 1, z: 1 }, // A, idx 0
        { x: -1, y: 1, z: 1 }, // B, idx 1
        { x: 1, y: -1, z: 1 }, // C, idx 2
        { x: -1, y: -1, z: 1 }, // D, idx 3
        { x: 1, y: 1, z: -1 }, // E, idx 4
        { x: -1, y: 1, z: -1 }, // F, idx 5
        { x: 1, y: -1, z: -1 }, // G, idx 6
        { x: -1, y: -1, z: -1 }, // H, idx 7
    ],

      // an array of the indics for the two vertices in each edge
    edges: [
        [0, 1], //AB
        [0, 2], //AC
        [0, 4], //AE
        [2, 3], //CD
        [1, 3], //BD
        [2, 6], //CG
        [4, 5], //EF
        [4, 6], //EG
        [1, 5], //BF
        [6, 7], //GH
        [5, 7], //FH
        [3, 7], //DH
    ]
};


function drawCube() {
    clearCanvas();

    drawWireframe(
        cubeModel.vertices,
        cubeModel.edges,
        "#FFFFFF",
        cubeCamera
    );
}

function resetCube() {
    updateCubeCamera({ KeyR: true });
    drawCube();
}



function updateCubeCamera(keys) {

    switch (Object.keys(keys)[0]) {
        case "ArrowUp":
            cubeCamera.z += 0.1;
            break;
        case "ArrowDown":
            cubeCamera.z -= 0.1;
            break;
        case "ArrowLeft":
            cubeCamera.x -= 0.1;
            break;
        case "ArrowRight":
            cubeCamera.x += 0.1;
            break;
        case "KeyR":
            cubeCamera.x = 0;
            cubeCamera.y = 0;
            cubeCamera.z = -10;
            break;
    }

    // Prevent the camera from passing
    // through the cube.
    cubeCamera.z = Math.min(
        cubeCamera.z,
        -1.5
    );
}


// Wireframe drawing models

const roadModel = {

    vertices: [
        { x: -4, y: 0, z: -5 }, // 0
        { x:  4, y: 0, z: -5 }, // 1
        { x: -4, y: 0, z: 110 }, // 2
        { x:  4, y: 0, z: 110 }  // 3
    ],

    edges: [
        // [0, 1],
        [1, 3],
        // [3, 2],
        [2, 0]
    ],

    color: "#666666"
};


const laneModel = {

    vertices: [
        { x: 0, y: 0, z: -1 },
        { x: 0, y: 0, z:  1 }
    ],

    edges: [
        [0, 1]
    ],

    color: "#FFFFFF"
};


const treeModel = {
    vertices: [
        // Cube base - 1 unit wide, tall, and deep, resting on the ground.
        { x: -0.5, y: 0, z: -0.5 }, // 0
        { x:  0.5, y: 0, z: -0.5 }, // 1
        { x:  0.5, y: 1, z: -0.5 }, // 2
        { x: -0.5, y: 1, z: -0.5 }, // 3
        { x: -0.5, y: 0, z:  0.5 }, // 4
        { x:  0.5, y: 0, z:  0.5 }, // 5
        { x:  0.5, y: 1, z:  0.5 }, // 6
        { x: -0.5, y: 1, z:  0.5 }, // 7

        // Square pyramid canopy: four base corners and one centered apex.
        { x: -1, y: 1, z: -1 }, // 8
        { x:  1, y: 1, z: -1 }, // 9
        { x:  1, y: 1, z:  1 }, // 10
        { x: -1, y: 1, z:  1 }, // 11
        { x:  0, y: 4, z:  0 }  // 12
    ],
    edges: [
        // Cube faces and connecting edges.
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],

        // Square base and four edges leading to the apex.
        [8, 9], [9, 10], [10, 11], [11, 8],
        [8, 12], [9, 12], [10, 12], [11, 12]
    ],
    color: "#228B22"
};


const mountainModel = {
    vertices: [
        // Keep the front base edge on the mountain line where the road ends.
        { x: -3, y: 0, z: 0 }, // 0
        { x:  3, y: 0, z: 0 }, // 1
        { x:  3, y: 0, z: 6 }, // 2
        { x: -3, y: 0, z: 6 }, // 3
        { x:  0, y: 4, z: 3 }  // 4: apex above the square's center
    ],
    edges: [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [0, 4], [1, 4], [2, 4], [3, 4]
    ],
    color: "#64748B"
};


const carModel = {

    vertices: [

        // Car body

        // Rear face 
        { x: -1, y: 0, z: -2 }, // 0
        { x:  1, y: 0, z: -2 }, // 1
        { x: -1, y: 1, z: -2 }, // 2
        { x:  1, y: 1, z: -2 }, // 3

        // Front face
        { x: -1, y: 0, z: 2 }, // 4
        { x:  1, y: 0, z: 2 }, // 5
        { x: -1, y: 1, z: 2 }, // 6
        { x:  1, y: 1, z: 2 }, // 7


        // tiangle like roofs

        // Rear roof base (Y = 1)
        { x: -0.8, y: 1, z: -1.2 }, // 8
        { x:  0.8, y: 1, z: -1.2 }, // 9

        // Rear roof top (Y = 2)
        { x: -0.6, y: 2, z: -0.7 }, // 10
        { x:  0.6, y: 2, z: -0.7 }, // 11

        // Front roof top (Y = 2)
        { x: -0.6, y: 2, z: 0.7 }, // 12
        { x:  0.6, y: 2, z: 0.7 }, // 13

        // Front roof base (Y = 1)
        { x: -0.8, y: 1, z: 1.2 }, // 14
        { x:  0.8, y: 1, z: 1.2 }, // 15


        // Rear lights

        // Left rear light
        { x: -0.9, y: 0.3, z: -2.01 }, // 16
        { x: -0.6, y: 0.3, z: -2.01 }, // 17
        { x: -0.9, y: 0.7, z: -2.01 }, // 18
        { x: -0.6, y: 0.7, z: -2.01 }, // 19

        // Right rear light
        { x: 0.6, y: 0.3, z: -2.01 }, // 20
        { x: 0.9, y: 0.3, z: -2.01 }, // 21
        { x: 0.6, y: 0.7, z: -2.01 }, // 22
        { x: 0.9, y: 0.7, z: -2.01 }  // 23
    ],

    edges: [

        // BODY: rear face
        [0, 1], [1, 3], [3, 2], [2, 0],

        // BODY: front face
        [4, 5], [5, 7], [7, 6], [6, 4],

        // BODY: connecting edges
        [0, 4], [1, 5], [2, 6], [3, 7],


        // ROOF: rear windshield
        [8, 9], [9, 11], [11, 10], [10, 8],

        // ROOF: top
        [10, 11], [11, 13], [13, 12], [12, 10],

        // ROOF: front windshield
        [12, 13], [13, 15], [15, 14], [14, 12],

        // ROOF: lower side connections
        [8, 14], [9, 15],


        // LEFT REAR LIGHT
        [16, 17], [17, 19], [19, 18], [18, 16],

        // RIGHT REAR LIGHT
        [20, 21], [21, 23], [23, 22], [22, 20]
    ],

    color: "#2563EB"
};


function transformVertex(vertex, position, scale) {

    return {
        x: vertex.x * scale + position.x,
        y: vertex.y * scale + position.y,
        z: vertex.z * scale + position.z
    };
}


let scene = [];

function createScene() {

    scene = [];


    scene.push({
        model: mountainModel,
        position: { x: -28, y: 0, z: 110 },
        scale: 8,
        color: "#64748B",
        type: "mountain"
    });

    scene.push({
        model: mountainModel,
        position: { x: -80, y: 0, z: 110 },
        scale: 10,
        color: "#64748B",
        type: "mountain"
    });

    scene.push({
        model: mountainModel,
        position: { x: 34, y: 0, z: 110 },
        scale: 10,
        color: "#64748B",
        type: "mountain"
    });

    scene.push({
        model: mountainModel,
        position: { x: 84, y: 0, z: 110 },
        scale: 8,
        color: "#64748B",
        type: "mountain"
    });

    scene.push({
        model: roadModel,
        position: { x: 0, y: 0, z: 0 },
        scale: 1,
        color: "#666666",
        type: "road"
    });

    // Lane dividers
    for (let z = 0; z <= 100; z += 10) {

        scene.push({
            model: laneModel,
            position: { x: 0, y: 0.02, z: z },
            scale: 1,
            color: "#FFFFFF",
            type: "lane"
        });
    }

    // Trees
    for (let z = 5; z <= 95; z += 10) {

        scene.push({
            model: treeModel,
            position: { x: -7, y: 0, z: z },
            scale: 1,
            color: "#228B22",
            type: "tree"
        });

        scene.push({
            model: treeModel,
            position: { x: 7, y: 0, z: z },
            scale: 1.5,
            color: "#228B22",
            type: "tree"
        });
    }

    // Player car
    scene.push({
        model: carModel,
        position: { x: -2, y: 0, z: 3 },
        scale: 0.8,
        color: "#2563EB",
        type: "player"
    });
}


function drawGameWireframe() {

    if (activeButtonId === "btn_wireframe")
        clearCanvas();
    else if (activeButtonId === "btn_320x200")
        resetPixelArray();

    for (const object of scene) {

        // Transform vertices into scaled world coordinates
        const worldVertices =
            object.model.vertices.map(vertex =>
                transformVertex(
                    vertex,
                    object.position,
                    object.scale
                )
            );

        // Draw using existing wireframe renderer
        drawWireframe(
            worldVertices,
            object.model.edges,
            object.color,
            gameCamera
        );
    }

}


function animateWireframeScene() {

    for (const object of scene) {

        // Move trees and lane markings only
        if (
            object.model === treeModel ||
            object.model === laneModel
        ) {

            object.position.z -= speed;

            // When an object passes the camera,
            // move it back to the far end of the road.
            if (object.position.z < gameCamera.z) {

                object.position.z += Math.ceil((gameCamera.z - object.position.z) / 100) * 100;

            }
        }
    }

    drawGameWireframe();
}


function gameController(key) {

    const car = scene.find(
        object => object.model === carModel
    );

    if (!car) return;

    if (key === "KeyA") {
    car.position.x -= 0.2;
    }

    if (key === "KeyD") {
    car.position.x += 0.2;
    }

    if (key === "KeyW") {
    speed = Math.min(maxSpeed, speed + 0.1);
    }

    if (key === "KeyS") {
    speed = Math.max(0.5, speed - 0.1);
    }

    // Keep the car inside the road
    car.position.x = Math.max(
        -3,
        Math.min(3, car.position.x)
    );
}


function resetWireframe() {
    gameCamera.x = 0;
    gameCamera.y = 5;
    gameCamera.z = -10;

    createScene();
    drawGameWireframe();
}


//  320 x 200 px model related codes


const pixelGrid = Array.from({ length: WIDTH }, () =>
    Array(HEIGHT).fill("#050510")
);

function resetPixelArray() {
    for (const column of pixelGrid) column.fill("#050510");
    drawPxelArry();
}

function drawPxelArry() {
    clearCanvas();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#444444";

    for (let v = 0; v < HEIGHT; v++) {
        for (let u = 0; u < WIDTH; u++) {
            ctx.fillStyle = pixelGrid[u][v];
            ctx.fillRect(u * PIXEL_SIZE, v * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            ctx.strokeRect(u * PIXEL_SIZE, v * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
    }
}


function resetGameCamera() {
    gameCamera.x = 0;
    gameCamera.y = 5;
    gameCamera.z = -10;
}

function updateGameCamera(input) {

    switch (Object.keys(input)[0]) {
        case "ArrowUp":
            gameCamera.z += 0.1;
            break;
        case "ArrowDown":
            gameCamera.z -= 0.1;
            break;
        case "ArrowLeft":
            gameCamera.x -= 0.1;
            break;
        case "ArrowRight":
            gameCamera.x += 0.1;
            break;
        case "KeyR":
            resetGameCamera();
            break;
    }

    gameCamera.z = Math.min(gameCamera.z, -6);
    gameCamera.z = Math.max(-15, gameCamera.z);
}


// One loop owns animation; drawing and input handlers never start timers.
async function animate(animationMethod){
    const sleep = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));
    

    while (activeButtonId === "btn_wireframe" || activeButtonId === "btn_320x200") {

        animationMethod();
        showSpeed();


        await sleep(30);
    }
}

// Canvas and navigation control
function fitCanvas() {
    const area = document.querySelector(".canvas-area");
    const scale = Math.min(area.clientWidth / canvas.width, area.clientHeight / canvas.height);
    canvas.style.width = `${canvas.width * scale}px`;
    canvas.style.height = `${canvas.height * scale}px`;
}

function setMode(nextMode) {
    clearCanvas();
    
    activeButtonId = nextMode !== "btn_reset" ? nextMode : activeButtonId;
    lastFrameTime = null;
    accumulatedTime = 0;

    switch (nextMode) {
        case "btn_cube":
            clearCanvas();
            drawCube();
            break;  
        case "btn_wireframe":
            createScene();
            animate(animateWireframeScene);
            break;
        case "btn_320x200":
            resetPixelArray();
            createScene();
            animate(animateWireframeScene);
            break;
        case "btn_triangle_fill":
            break;
        case "btn_reset":
            clearCanvas();

            if (activeButtonId === "btn_cube") resetCube();
            else if (activeButtonId === "btn_wireframe") resetWireframe();
            else if (activeButtonId === "btn_320x200"){
                resetPixelArray();
                resetGameCamera();
            }
            break;

        default:
            return;
    }

    document.querySelectorAll("[data-mode]").forEach(button => {
        button.setAttribute("aria-pressed", String(button.id === activeButtonId));
    });

    fitCanvas();
}


document.querySelectorAll("button.mode-button").forEach(button => {
    button.addEventListener("click", () => setMode(button.id));
});

const helpDialog = document.getElementById("helpDialog");
document.getElementById("btn_help").addEventListener("click", () => helpDialog.showModal());
document.getElementById("closeHelp").addEventListener("click", () => helpDialog.close());


document.addEventListener("keydown", event => {
    if (helpDialog.open) return;
    if (event.target?.matches("input, textarea, select, [contenteditable]")) return;

    event.preventDefault();


    if (event.code.startsWith("Arrow")) {

        if (activeButtonId === "btn_cube") {
            updateCubeCamera({ [event.code]: true });
            drawCube();
        }
        else {
            updateGameCamera({ [event.code]: true });
        }
    }

    if (activeButtonId === "btn_wireframe" || activeButtonId === "btn_320x200") {
        gameController(event.code);
    }
    
});

new ResizeObserver(fitCanvas).observe(document.querySelector(".canvas-area"));
setMode("btn_cube");