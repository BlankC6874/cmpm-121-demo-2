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
const brushSizes = [2, 5, 10]; // Define brush sizes
let currentBrushSizeLevel = 1; // Default to the middle size
let toolPreview: ToolPreview | null = null;

class MarkerLine {
    private points: { x: number, y: number }[] = [];
    private lineWidth: number;

    constructor(initialX: number, initialY: number, lineWidth: number) {
        this.points.push({ x: initialX, y: initialY });
        this.lineWidth = lineWidth;
    }

    drag(x: number, y: number) {
        this.points.push({ x, y });
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.lineWidth = this.lineWidth;
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

class ToolPreview {
    private x: number;
    private y: number;
    private lineWidth: number;

    constructor(x: number, y: number, lineWidth: number) {
        this.x = x;
        this.y = y;
        this.lineWidth = lineWidth;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.lineWidth / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "gray";
        ctx.stroke();
    }
}

canvas.addEventListener("mousedown", (event) => {
    drawing = true;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    const newLine = new MarkerLine(x, y, brushSizes[currentBrushSizeLevel]);
    lines.push(newLine);
    redoStack = []; // Clear redo stack on new drawing
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    ctx.beginPath();
});

canvas.addEventListener("mousemove", (event) => {
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    if (!drawing) {
        if (!toolPreview) {
            toolPreview = new ToolPreview(x, y, brushSizes[currentBrushSizeLevel]);
        } else {
            toolPreview.updatePosition(x, y);
        }
        const toolMovedEvent = new Event("tool-moved");
        canvas.dispatchEvent(toolMovedEvent);
    } else {
        const currentLine = lines[lines.length - 1];
        currentLine.drag(x, y);
        const drawingChangedEvent = new Event("drawing-changed");
        canvas.dispatchEvent(drawingChangedEvent);
    }
});

canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    lines.forEach(line => line.display(ctx));
});

canvas.addEventListener("tool-moved", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    lines.forEach(line => line.display(ctx));
    if (toolPreview) {
        toolPreview.draw(ctx);
    }
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

// Create and add the thin marker button
const thinButton = document.createElement("button");
thinButton.textContent = "Thin";
thinButton.addEventListener("click", () => {
    if (currentBrushSizeLevel > 0) {
        currentBrushSizeLevel--;
    }
    updateSelectedTool(thinButton);
});
app.appendChild(thinButton);

// Create and add the thick marker button
const thickButton = document.createElement("button");
thickButton.textContent = "Thick";
thickButton.addEventListener("click", () => {
    if (currentBrushSizeLevel < brushSizes.length - 1) {
        currentBrushSizeLevel++;
    }
    updateSelectedTool(thickButton);
});
app.appendChild(thickButton);

// Function to update the selected tool button
function updateSelectedTool(selectedButton: HTMLButtonElement) {
    document.querySelectorAll("button").forEach(button => {
        button.classList.remove("selectedTool");
    });
    selectedButton.classList.add("selectedTool");
}

// Initial tool selection
updateSelectedTool(thinButton);