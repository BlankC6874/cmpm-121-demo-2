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
let stickers: Sticker[] = [];
let redoStack: (MarkerLine | Sticker)[] = [];
const brushSizes = [2, 5, 10]; // Define brush sizes
let currentBrushSizeLevel = 1; // Default to the middle size
let toolPreview: ToolPreview | null = null;
let currentSticker: string | null = null;

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

class Sticker {
    private x: number;
    private y: number;
    private sticker: string;

    constructor(x: number, y: number, sticker: string) {
        this.x = x;
        this.y = y;
        this.sticker = sticker;
    }

    drag(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    display(ctx: CanvasRenderingContext2D) {
        ctx.font = "24px Arial";
        ctx.fillText(this.sticker, this.x, this.y);
    }
}

class ToolPreview {
    private x: number;
    private y: number;
    private lineWidth: number;
    private sticker: string | null;

    constructor(x: number, y: number, lineWidth: number, sticker: string | null) {
        this.x = x;
        this.y = y;
        this.lineWidth = lineWidth;
        this.sticker = sticker;
    }

    updatePosition(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    updateSticker(sticker: string | null) {
        this.sticker = sticker;
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        if (this.sticker) {
            ctx.font = "24px Arial";
            ctx.fillText(this.sticker, this.x, this.y);
        } else {
            ctx.arc(this.x, this.y, this.lineWidth / 2, 0, Math.PI * 2);
            ctx.strokeStyle = "gray";
            ctx.stroke();
        }
    }
}

canvas.addEventListener("mousedown", (event) => {
    drawing = true;
    const x = event.clientX - canvas.offsetLeft;
    const y = event.clientY - canvas.offsetTop;
    if (currentSticker) {
        const newSticker = new Sticker(x, y, currentSticker);
        stickers.push(newSticker);
        redoStack = []; // Clear redo stack on new drawing
    } else {
        const newLine = new MarkerLine(x, y, brushSizes[currentBrushSizeLevel]);
        lines.push(newLine);
        redoStack = []; // Clear redo stack on new drawing
    }
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
            toolPreview = new ToolPreview(x, y, brushSizes[currentBrushSizeLevel], currentSticker);
        } else {
            toolPreview.updatePosition(x, y);
            toolPreview.updateSticker(currentSticker);
        }
        const toolMovedEvent = new Event("tool-moved");
        canvas.dispatchEvent(toolMovedEvent);
    } else {
        if (currentSticker) {
            const currentStickerObj = stickers[stickers.length - 1];
            currentStickerObj.drag(x, y);
        } else {
            const currentLine = lines[lines.length - 1];
            currentLine.drag(x, y);
        }
        const drawingChangedEvent = new Event("drawing-changed");
        canvas.dispatchEvent(drawingChangedEvent);
    }
});

canvas.addEventListener("drawing-changed", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    lines.forEach(line => line.display(ctx));
    stickers.forEach(sticker => sticker.display(ctx));
});

canvas.addEventListener("tool-moved", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";

    lines.forEach(line => line.display(ctx));
    stickers.forEach(sticker => sticker.display(ctx));
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
    stickers = [];
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
    } else if (stickers.length > 0) {
        const lastSticker = stickers.pop();
        if (lastSticker) {
            redoStack.push(lastSticker);
        }
    }
    const drawingChangedEvent = new Event("drawing-changed");
    canvas.dispatchEvent(drawingChangedEvent);
});
app.appendChild(undoButton);

// Create and add the redo button
const redoButton = document.createElement("button");
redoButton.textContent = "Redo";
redoButton.addEventListener("click", () => {
    if (redoStack.length > 0) {
        const lastItem = redoStack.pop();
        if (lastItem instanceof MarkerLine) {
            lines.push(lastItem);
        } else if (lastItem instanceof Sticker) {
            stickers.push(lastItem);
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
    currentSticker = null;
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
    currentSticker = null;
    updateSelectedTool(thickButton);
});
app.appendChild(thickButton);

// Initial set of stickers
const initialStickers = ["😀", "🌟", "❤️"];
let stickersList = [...initialStickers];

// Function to create sticker buttons
function createStickerButtons() {
    stickersList.forEach(sticker => {
        const stickerButton = document.createElement("button");
        stickerButton.textContent = sticker;
        stickerButton.addEventListener("click", () => {
            currentSticker = sticker;
            updateSelectedTool(stickerButton);
            const toolMovedEvent = new Event("tool-moved");
            canvas.dispatchEvent(toolMovedEvent);
        });
        app.appendChild(stickerButton);
    });
}

// Create and add sticker buttons
createStickerButtons();

// Create and add the custom sticker button
const customStickerButton = document.createElement("button");
customStickerButton.textContent = "Custom Sticker";
customStickerButton.addEventListener("click", () => {
    const customSticker = prompt("Enter your custom sticker:", "🎨");
    if (customSticker) {
        stickersList.push(customSticker);
        const stickerButton = document.createElement("button");
        stickerButton.textContent = customSticker;
        stickerButton.addEventListener("click", () => {
            currentSticker = customSticker;
            updateSelectedTool(stickerButton);
            const toolMovedEvent = new Event("tool-moved");
            canvas.dispatchEvent(toolMovedEvent);
        });
        app.appendChild(stickerButton);
    }
});
app.appendChild(customStickerButton);

// Create and add the export button
const exportButton = document.createElement("button");
exportButton.textContent = "Export";
exportButton.addEventListener("click", () => {
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1024;
    exportCanvas.height = 1024;
    const exportCtx = exportCanvas.getContext("2d")!;
    exportCtx.scale(4, 4); // Scale to 4x

    // Redraw all items on the new canvas
    lines.forEach(line => line.display(exportCtx));
    stickers.forEach(sticker => sticker.display(exportCtx));

    // Trigger download
    exportCanvas.toBlob((blob) => {
        if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "sticker_sketchpad.png";
            a.click();
            URL.revokeObjectURL(url);
        }
    });
});
app.appendChild(exportButton);

// Function to update the selected tool button
function updateSelectedTool(selectedButton: HTMLButtonElement) {
    document.querySelectorAll("button").forEach(button => {
        button.classList.remove("selectedTool");
    });
    selectedButton.classList.add("selectedTool");
}

// Initial tool selection
updateSelectedTool(thinButton);