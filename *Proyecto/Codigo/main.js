import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Paramétros genérales
let WORLD_RADIUS = 20;
let NUM_PREYS = 40;
let NUM_PREDATORS = 8;

let preys = [];
let predators = [];

let preySpeed = 3.0;
let predSpeed = 2.7;

const fleeRadius = 2.5;
const eatThreshold = 0.3;
const jitterAmp = 0.7;
const predJitter = 0.8;

let simulationRunning = false;

// UI Elementos
const homePanel = document.getElementById("homePanel");
const simPanel = document.getElementById("simPanel");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");

// Sliders
const preyCountSlider = document.getElementById("preyCountSlider");
const predCountSlider = document.getElementById("predCountSlider");

function updateSliderLabels() {
    document.getElementById("preyCountLabel").innerText = preyCountSlider.value;
    document.getElementById("predCountLabel").innerText = predCountSlider.value;
}
preyCountSlider.addEventListener("input", updateSliderLabels);
predCountSlider.addEventListener("input", updateSliderLabels);

// Empezar simulación
startBtn.addEventListener("click", () => {
    NUM_PREYS = parseInt(preyCountSlider.value);
    NUM_PREDATORS = parseInt(predCountSlider.value);

    homePanel.style.display = "none";
    simPanel.style.display = "block";
    simulationRunning = true;

    preyCountSlider.disabled = true;
    predCountSlider.disabled = true;

    initPopulation();
});

// Terminar simulación
stopBtn.addEventListener("click", () => {
    simulationRunning = false;

    preys.forEach(p => scene.remove(p));
    predators.forEach(pr => scene.remove(pr));
    preys = [];
    predators = [];

    homePanel.style.display = "block";
    simPanel.style.display = "none";

    preyCountSlider.disabled = false;
    predCountSlider.disabled = false;
});

function initPopulation() {
    for (let i = 0; i < NUM_PREYS; i++) {
        const p = createPrey();
    }
    for (let i = 0; i < NUM_PREDATORS; i++) {
        const pr = createPredator();
    }
}

// Inicialización de la escena 3D
const canvas = document.getElementById("glcanvas");

const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio || 1);

const scene = new THREE.Scene();

const textureLoader = new THREE.TextureLoader();
const skyTexture = textureLoader.load('textures/ciel.jpeg');
scene.background = skyTexture;

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(0, 40, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minPolarAngle = 0.1;
controls.maxPolarAngle = Math.PI - 0.1;

// Luces y ambiente
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);
scene.add(new THREE.AmbientLight(0x444444));

const floorTexture = textureLoader.load('textures/savane.jpg');
floorTexture.wrapS = THREE.RepeatWrapping;
floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(1, 1);

const floorGeometry = new THREE.CircleGeometry(WORLD_RADIUS, 60);
const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 1,
    metalness: 0
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = 0;
scene.add(floor);

// Controles de la cámara

const ROT_ANGLE = THREE.MathUtils.degToRad(10);

function rotateCameraAround(axis, angle) {
    const offset = camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(axis, angle);
    camera.position.copy(offset.add(controls.target));
    camera.lookAt(controls.target);
    controls.update();
}

document.getElementById("camLeft").addEventListener("click", () => {
    rotateCameraAround(new THREE.Vector3(0, 1, 0), ROT_ANGLE);
});

document.getElementById("camRight").addEventListener("click", () => {
    rotateCameraAround(new THREE.Vector3(0, 1, 0), -ROT_ANGLE);
});

document.getElementById("camUp").addEventListener("click", () => {
    rotateCameraAround(new THREE.Vector3(1, 0, 0), ROT_ANGLE);
});

document.getElementById("camDown").addEventListener("click", () => {
    rotateCameraAround(new THREE.Vector3(1, 0, 0), -ROT_ANGLE);
});

document.getElementById("camZoomIn").addEventListener("click", () => {
    camera.position.y -= 1;
});

document.getElementById("camZoomOut").addEventListener("click", () => {
    camera.position.y += 1;
});

document.getElementById("camReset").addEventListener("click", () => {
    camera.position.set(0, 40, 0);
    controls.target.set(0, 0, 0);
    controls.update();
});

// Creación de agentes presas y depredadores
function createPrey() {
    const geometry = new THREE.SphereGeometry(0.25, 12, 12);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const prey = new THREE.Mesh(geometry, material);

    prey.position.set(
        (Math.random() - 0.5) * (WORLD_RADIUS * 1.6),
        0.15,
        (Math.random() - 0.5) * (WORLD_RADIUS * 1.6)
    );

    const v = new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5));
    v.normalize();
    v.multiplyScalar(preySpeed * (0.6 + Math.random() * 0.8));

    prey.userData = {
        vel: v,
        age: 0,
        lifespan: 75 + Math.random() * 10
    };

    scene.add(prey);
    preys.push(prey);
    return prey;
}

function createPredator() {
    const geometry = new THREE.BoxGeometry(0.35, 0.35, 0.35);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    const pred = new THREE.Mesh(geometry, material);

    pred.position.set(
        (Math.random() - 0.5) * (WORLD_RADIUS * 1.6),
        0.125,
        (Math.random() - 0.5) * (WORLD_RADIUS * 1.6)
    );

    const v = new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5));
    v.normalize();
    v.multiplyScalar(predSpeed * (0.8 + Math.random() * 0.6));

    pred.userData = {
        vel: v,
        age: 0,
        lifespan: 75 + Math.random() * 10
    };

    scene.add(pred);
    predators.push(pred);
    return pred;
}

// Población inicial
if (simulationRunning) {
    for (let i = 0; i < NUM_PREYS; i++) createPrey();
    for (let i = 0; i < NUM_PREDATORS; i++) createPredator();
}

// Funciones utiles
function keepInsideCircularWorld(agent) {
    const pos = agent.position;
    const vel = agent.userData.vel;

    const dist = Math.sqrt(pos.x * pos.x + pos.z * pos.z);

    if (dist <= WORLD_RADIUS) return;

    const nx = pos.x / dist;
    const nz = pos.z / dist;

    pos.x = nx * WORLD_RADIUS;
    pos.z = nz * WORLD_RADIUS;

    const dot = vel.x * nx + vel.z * nz;

    vel.x = vel.x - 2 * dot * nx;
    vel.z = vel.z - 2 * dot * nz;

    vel.x *= 0.9;
    vel.z *= 0.9;

    vel.y = 0;
}

function getClosestPredator(prey) {
    let closest = null;
    let minD = Infinity;
    for (let pr of predators) {
        const d = prey.position.distanceTo(pr.position);
        if (d < minD) { minD = d; closest = pr; }
    }
    return closest ? { predator: closest, distance: minD } : null;
}

function getClosestPrey(pred) {
    let closest = null;
    let minD = Infinity;
    for (let p of preys) {
        const d = pred.position.distanceTo(p.position);
        if (d < minD) { minD = d; closest = p; }
    }
    return closest ? { prey: closest, distance: minD } : null;
}

// Desplazamiento de las presas y depredadores
function movePreys(dt) {
    for (let p of preys) {
        if (!p.userData.vel) p.userData.vel = new THREE.Vector3(0, 0, 0);

        const info = getClosestPredator(p);
        if (info && info.distance < fleeRadius) {
            const fleeDir = new THREE.Vector3().subVectors(p.position, info.predator.position);
            fleeDir.y = 0;
            fleeDir.normalize();
            const strength = 4.0 * (1 - Math.min(info.distance / fleeRadius, 1.0));
            p.userData.vel.add(fleeDir.multiplyScalar(strength * dt));
        }

        const jitter = new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5))
            .multiplyScalar(jitterAmp * dt);
        p.userData.vel.add(jitter);

        if (p.userData.vel.length() > preySpeed) p.userData.vel.setLength(preySpeed);

        p.position.addScaledVector(p.userData.vel, dt);
        p.userData.vel.multiplyScalar(0.985);

        keepInsideCircularWorld(p);
    }
}

function movePredators(dt) {
    for (let pr of predators) {
        if (!pr.userData.vel) pr.userData.vel = new THREE.Vector3(0, 0, 0);

        const info = getClosestPrey(pr);
        if (info && info.prey) {
            const dir = new THREE.Vector3().subVectors(info.prey.position, pr.position);
            dir.y = 0;
            dir.normalize();
            pr.userData.vel.add(dir.multiplyScalar(6.0 * dt));
        } else {
            const jitter = new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5))
                .multiplyScalar(predJitter * dt);
            pr.userData.vel.add(jitter);
            pr.userData.vel.multiplyScalar(0.99);
        }

        if (pr.userData.vel.length() > predSpeed) pr.userData.vel.setLength(predSpeed);

        pr.position.addScaledVector(pr.userData.vel, dt);
        keepInsideCircularWorld(pr);
    }
}

// Interacciones : comida, muerte, reproducción
function handleEating() {
    for (let i = predators.length - 1; i >= 0; i--) {
        const pr = predators[i];
        for (let j = preys.length - 1; j >= 0; j--) {
            const prey = preys[j];
            if (pr.position.distanceTo(prey.position) < eatThreshold) {
                scene.remove(prey);
                preys.splice(j, 1);
                break;
            }
        }
    }
}

function handleNaturalDeath(dt) {
    for (let i = preys.length - 1; i >= 0; i--) {
        preys[i].userData.age += dt;
        if (preys[i].userData.age > preys[i].userData.lifespan) {
            scene.remove(preys[i]);
            preys.splice(i, 1);
        }
    }

    for (let i = predators.length - 1; i >= 0; i--) {
        predators[i].userData.age += dt;
        if (predators[i].userData.age > predators[i].userData.lifespan) {
            scene.remove(predators[i]);
            predators.splice(i, 1);
        }
    }
}

function handleReproduction(dt) {
    for (let p of preys) {
        if (p.userData.age > 2 && Math.random() < 0.02 * dt) createPrey();
    }
    for (let pr of predators) {
        if (pr.userData.age > 5 && Math.random() < 0.01 * dt) createPredator();
    }
}

// Grafico de población usando Chart.js
const ctx = document.getElementById("popChart").getContext("2d");

const popChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: [],
        datasets: [
            {
                label: "Preys",
                data: [],
                borderColor: "green",
                borderWidth: 1,
                tension: 0.2,
                pointRadius: 0.5
            },
            {
                label: "Predators",
                data: [],
                borderColor: "red",
                borderWidth: 1,
                tension: 0.2,
                pointRadius: 0.5
            }
        ]
    },
    options: {
        animation: false,
        responsive: false,

        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    font: { size: 14 },
                    color: "black",
                    boxWidth: 5,
                    boxHeight: 5,
                    generateLabels: function (chart) {
                        const datasets = chart.data.datasets;
                        return datasets.map((dataset, i) => ({
                            text: dataset.label,
                            fillStyle: dataset.borderColor,
                            strokeStyle: dataset.borderColor,
                            lineWidth: dataset.borderWidth,
                            pointStyle: 'circle',
                            hidden: !chart.isDatasetVisible(i),
                            index: i
                        }));
                    }
                }
            }
        },

        scales: {
            x: {
                ticks: {
                    display: true
                },
                grid: {
                    drawTicks: true,
                    drawOnChartArea: false,
                    drawBorder: true
                }
            },
            y: {
                ticks: {
                    font: { size: 14 },
                    color: "black"
                },
                grid: {
                    drawTicks: true,
                    color: "rgba(0,0,0,0.1)"
                }
            }
        }
    }
});

// Bucle de animación
let lastTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const now = performance.now();
    let dt = (now - lastTime) / 1000;
    if (dt > 0.05) dt = 0.05;
    lastTime = now;

    if (simulationRunning) {
        movePreys(dt);
        movePredators(dt);
        handleEating();
        handleNaturalDeath(dt);
        handleReproduction(dt);

        for (let p of preys) {
            if (p.userData.vel.lengthSq() > 1e-4) {
                p.rotation.y = Math.atan2(p.userData.vel.x, p.userData.vel.z);
            }
        }

        for (let pr of predators) {
            if (pr.userData.vel.lengthSq() > 1e-4) {
                pr.rotation.y = Math.atan2(pr.userData.vel.x, pr.userData.vel.z);
            }
        }

        if (!window._graphCounter) window._graphCounter = 0;
        window._graphCounter++;

        if (window._graphCounter % 2 === 0) {
            popChart.data.labels.push("");
            popChart.data.datasets[0].data.push(preys.length);
            popChart.data.datasets[1].data.push(predators.length);

            if (popChart.data.labels.length > 200) {
                popChart.data.labels.shift();
                popChart.data.datasets[0].data.shift();
                popChart.data.datasets[1].data.shift();
            }

            popChart.update();
        }
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

// Ajuste de la ventana
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});