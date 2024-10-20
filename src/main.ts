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
let lines: MarkerLine[] = [];
let redoStack: MarkerLine[] = [];

class MarkerLine {
    private points: { x: number, y: number }[] = [];

    constructor(initialX: number, initialY: number) {
        this.points.push({ x: initialX, y: initialY });
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        this.points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        });
        ctx.stroke();
    }
}

canvas.addEventListener("mousedown", (event) => {
    drawing = true;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const newLine = new MarkerLine(x, y);
    lines.push(newLine);
    redoStack = []; // Clear redo stack on new drawing
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.beginPath();
});

canvas.addEventListener("mousemove", (event) => {
    if (!drawing) return;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const currentLine = lines[lines.length - 1];
    currentLine.drag(x, y);
    const drawingChangedEvent = new Event("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
});

canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    lines.forEach(line => line.display(ctx));
});

// Create and add the clear button
const clearButton = document.createElement("button");
clearButton.textContent = "Clear";
clearButton.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    lines = [];
    redoStack = [];
    const drawingChangedEvent = new Event("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
});
app.appendChild(clearButton);

// Create and add the undo button
const undoButton = document.createElement("button");
undoButton.textContent = "Undo";
undoButton.addEventListener("click", () => {
    if (lines.length > 0) {
        const lastLine = lines.pop();
        if (lastLine) {
            redoStack.push(lastLine);
        }
        const drawingChangedEvent = new Event("drawing-changed");
        canvas.dispatchEvent(drawingChangedEvent);
    }
});
app.appendChild(undoButton);

// Create and add the redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const lastLine = redoStack.pop();
        if (lastLine) {
            lines.push(lastLine);
        }
        const drawingChangedEvent = new Event("drawing-changed");
        canvas.dispatchEvent(drawingChangedEvent);
    }
});
app.appendChild(redoButton);