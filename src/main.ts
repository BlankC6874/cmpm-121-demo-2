import "./style.css";

const APP_NAME = "Sticker Sketchpad";
const app = document.querySelector<HTMLDivElement>("#app")!;

document.title = APP_NAME;

// Create and add the h1 element for the app title
const titleElement = document.createElement("h1");
titleElement.textContent = APP_NAME;
app.appendChild(titleElement);

// Create and add the canvas element
const canvas = document.createElement("canvas");
canvas.width = 256;
canvas.height = 256;
app.appendChild(canvas);

const ctx = canvas.getContext("2d")!;
let drawing = false;
let lines: { x: number, y: number }[][] = [];
let currentLine: { x: number, y: number }[] = [];

canvas.addEventListener("mousedown", () => {
    drawing = true;
    currentLine = [];
    lines.push(currentLine);
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.beginPath();
});

canvas.addEventListener("mousemove", (event) => {
    if (!drawing) return;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    currentLine.push({ x, y });
    const drawingChangedEvent = new Event("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
});

canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    lines.forEach(line => {
        ctx.beginPath();
        line.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    });
});

// Create and add the clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines = [];
});
app.appendChild(clearButton);