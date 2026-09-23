
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let WIDTH = 320;
const HEIGHT = 200;

let PIXEL_SIZE = 5;

canvas.width = WIDTH * PIXEL_SIZE;
canvas.height = HEIGHT * PIXEL_SIZE;

let activeButtonId = "btn_cube";


let cubeCamera = {
    x: 0,
    y: 0,
    z: -10
};

const gameCamera = {
    x: 0,
    y: 2,
    z: -10
};


const FOCAL_LENGTH = 200;

// Reusable functions for 3D projection and drawing wireframes

function project(vertex, camera) {

    const x = vertex.x - camera.x;
    const y = vertex.y - camera.y;
    const z = vertex.z - camera.z;

    // Ignore vertices behind or too close
    // to the camera.
    if (z <= 0.1) {
        return null;
    }

    const u =
        FOCAL_LENGTH * x / z + WIDTH / 2;

    const v =
        HEIGHT / 2 - FOCAL_LENGTH * y / z;

    return {
        u: u,
        v: v,
        depth: z
    };
}

function drawLine(u1, v1, u2, v2, color = "#FFFFFF") {

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
            1,
            1
        );

        u += uStep;
        v += vStep;
    }
}


function drawWireframe(vertices, edges, color, camera) {

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    for (const edge of edges) {

        const p1 = project(
            vertices[edge[0]],
            camera
        );

        const p2 = project(
            vertices[edge[1]],
            camera
        );

        if (p1 === null || p2 === null) {
            continue;
        }

        if (activeButtonId === "btn_wireframe") {
            ctx.beginPath();
            ctx.moveTo(p1.u * PIXEL_SIZE, p1.v * PIXEL_SIZE);
            ctx.lineTo(p2.u * PIXEL_SIZE, p2.v * PIXEL_SIZE);
            ctx.stroke();
            continue;
        }

        drawLine(
            p1.u * PIXEL_SIZE,
            p1.v * PIXEL_SIZE,
            p2.u * PIXEL_SIZE,
            p2.v * PIXEL_SIZE,
            color
        );
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

    switch (nextMode) {
        case "btn_cube":
            drawCube();
            break;  
        case "btn_wireframe":
            break;
        case "btn_300x200":
            break;
        case "btn_triangle_fill":
            break;
        case "btn_reset":
            clearCanvas();

            if (activeButtonId === "btn_cube") resetCube();
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

document.addEventListener("keydown", event => {
    if (event.code.startsWith("Arrow")) {
        event.preventDefault();
        updateCubeCamera({ [event.code]: true });
        drawCube();
    }
});

new ResizeObserver(fitCanvas).observe(document.querySelector(".canvas-area"));
setMode("btn_cube");
