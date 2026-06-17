const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");
const fs = require("fs");

const isDev = !app.isPackaged;

function createWindow() {
  const window = new BrowserWindow({
    width: 420,
    height: 760,
    minWidth: 360,
    minHeight: 640,
    backgroundColor: "#071211",
    title: "Kerala Temple Runner",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  Menu.setApplicationMenu(null);

  const productionIndex = path.join(__dirname, "..", "dist", "index.html");
  const devIndex = path.join(__dirname, "..", "index.html");
  const indexPath = fs.existsSync(productionIndex) ? productionIndex : devIndex;

  window.loadFile(indexPath);

  if (isDev) {
    window.webContents.on("before-input-event", (event, input) => {
      if (input.control && input.shift && input.key.toLowerCase() === "i") {
        window.webContents.openDevTools({ mode: "detach" });
      }
    });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
