const codeInput = document.getElementById("codeInput")
const lineNumbers = document.getElementById("lineNumbers")
const highlightCode = document.getElementById("highlightCode")
const highlightPre = document.getElementById("highlightPre")
const previewFrame = document.getElementById("previewFrame")
const consoleOutput = document.getElementById("consoleOutput")
const saveStatus = document.getElementById("saveStatus")
const previewStatus = document.getElementById("previewStatus")
const modeBadge = document.getElementById("modeBadge")
const currentFileLabel = document.getElementById("currentFileLabel")
const themeToggle = document.getElementById("themeToggle")
const clearBtn = document.getElementById("clearBtn")
const formatBtn = document.getElementById("formatBtn")
const downloadZipBtn = document.getElementById("downloadZipBtn")
const copyFileBtn = document.getElementById("copyFileBtn")
const copyAllBtn = document.getElementById("copyAllBtn")
const runToggleBtn = document.getElementById("runToggleBtn")
const clearConsoleBtn = document.getElementById("clearConsoleBtn")
const splitter = document.getElementById("splitter")
const workspace = document.querySelector(".workspace")
const fileButtons = [...document.querySelectorAll(".file-item")]
const tabButtons = [...document.querySelectorAll(".editor-tab")]

const storageKeys = {
  html: "codecanvas-html",
  css: "codecanvas-css",
  js: "codecanvas-js",
  theme: "codecanvas-theme",
  running: "codecanvas-running",
  active: "codecanvas-active-file",
  split: "codecanvas-split"
}

const defaults = {
  html: `<div class="hero">
  <div class="badge">CodeCanvas UI</div>
  <h1>Build, preview, and ship ideas faster</h1>
  <p>This playground updates in real time and includes a floating visual style, console panel, explorer, and ZIP export.</p>
  <button id="cta">Launch interaction</button>
  <div class="card-grid">
    <div class="mini-card">HTML</div>
    <div class="mini-card">CSS</div>
    <div class="mini-card">JavaScript</div>
  </div>
</div>`,
  css: `* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  font-family: Inter, Arial, sans-serif;
  color: white;
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.45), transparent 28%),
    radial-gradient(circle at top right, rgba(139, 92, 246, 0.38), transparent 26%),
    linear-gradient(135deg, #081120, #111b34 55%, #0d1f2a);
  overflow: hidden;
}

.hero {
  width: min(760px, 92vw);
  padding: 42px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(16px);
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
  animation: floatCard 6s ease-in-out infinite;
}

.badge {
  display: inline-flex;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(96, 165, 250, 0.16);
  border: 1px solid rgba(96, 165, 250, 0.32);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin: 18px 0 12px;
  font-size: clamp(2.2rem, 4vw, 4rem);
  line-height: 1.05;
}

p {
  margin: 0;
  max-width: 58ch;
  color: rgba(255, 255, 255, 0.82);
  font-size: 1.05rem;
}

button {
  margin-top: 24px;
  border: 0;
  border-radius: 14px;
  padding: 14px 18px;
  color: white;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  box-shadow: 0 18px 36px rgba(59, 130, 246, 0.28);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 24px 44px rgba(59, 130, 246, 0.34);
}

.card-grid {
  margin-top: 26px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.mini-card {
  padding: 18px;
  border-radius: 18px;
  text-align: center;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@keyframes floatCard {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}`,
  js: `const button = document.getElementById("cta")

button.addEventListener("click", () => {
  console.log("Interaction started")
  const note = document.createElement("div")
  note.textContent = "Smooth interaction activated"
  note.style.marginTop = "18px"
  note.style.padding = "14px 16px"
  note.style.borderRadius = "14px"
  note.style.background = "rgba(34, 197, 94, 0.14)"
  note.style.border = "1px solid rgba(34, 197, 94, 0.3)"
  note.style.fontWeight = "700"
  document.querySelector(".hero").appendChild(note)
})`
}

const fileMeta = {
  html: { label: "index.html", langClass: "language-markup", prismLang: "markup" },
  css: { label: "style.css", langClass: "language-css", prismLang: "css" },
  js: { label: "script.js", langClass: "language-javascript", prismLang: "javascript" }
}

let state = {
  activeFile: "html",
  running: true,
  isDragging: false,
  saveTimer: null,
  renderTimer: null
}

function getStoredCode(file) {
  return localStorage.getItem(storageKeys[file]) ?? defaults[file]
}

const codeStore = {
  html: getStoredCode("html"),
  css: getStoredCode("css"),
  js: getStoredCode("js")
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function ensureTrailingNewline(value) {
  return value.endsWith("\n") ? value : value + "\n"
}

function setSaveStatus(label, transient = false) {
  saveStatus.textContent = label
  if (transient) {
    clearTimeout(state.saveTimer)
    state.saveTimer = setTimeout(() => {
      saveStatus.textContent = "Saved"
    }, 900)
  }
}

function updateLineNumbers() {
  const count = Math.max(1, codeInput.value.split("\n").length)
  lineNumbers.textContent = Array.from({ length: count }, (_, i) => i + 1).join("\n")
}

function updateHighlighter() {
  const file = state.activeFile
  const meta = fileMeta[file]
  highlightCode.className = meta.langClass
  const raw = ensureTrailingNewline(codeInput.value)
  highlightCode.textContent = raw
  Prism.highlightElement(highlightCode)
}

function syncScroll() {
  highlightPre.scrollTop = codeInput.scrollTop
  highlightPre.scrollLeft = codeInput.scrollLeft
  lineNumbers.scrollTop = codeInput.scrollTop
}

function loadActiveFileIntoEditor() {
  const file = state.activeFile
  codeInput.value = codeStore[file]
  currentFileLabel.textContent = fileMeta[file].label
  updateLineNumbers()
  updateHighlighter()
  syncScroll()
  setActiveButtons()
}

function setActiveButtons() {
  fileButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.file === state.activeFile))
  tabButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.file === state.activeFile))
}

function saveCurrentBuffer() {
  const file = state.activeFile
  codeStore[file] = codeInput.value
  localStorage.setItem(storageKeys[file], codeStore[file])
  setSaveStatus("Saved", true)
}

function queuePreviewRender() {
  clearTimeout(state.renderTimer)
  state.renderTimer = setTimeout(renderPreview, 180)
}

function logToConsole(type, args) {
  const line = document.createElement("div")
  line.className = `console-line console-${type}`
  line.textContent = args.map(item => {
    if (typeof item === "string") return item
    try {
      return JSON.stringify(item, null, 2)
    } catch {
      return String(item)
    }
  }).join(" ")
  consoleOutput.appendChild(line)
  consoleOutput.scrollTop = consoleOutput.scrollHeight
}

function clearConsole() {
  consoleOutput.innerHTML = ""
}

function buildPreviewDocument() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<style>${codeStore.css}</style>
</head>
<body>
${codeStore.html}
<script>
(() => {
  const send = (type, args) => parent.postMessage({ source: "codecanvas-console", type, args }, "*")
  const patch = (method, type) => {
    const original = console[method]
    console[method] = (...args) => {
      send(type, args)
      original.apply(console, args)
    }
  }
  patch("log", "log")
  patch("warn", "warn")
  patch("error", "error")
  patch("info", "info")
  window.onerror = (message, source, lineno, colno) => {
    send("error", [String(message), "at line " + lineno + ":" + colno])
  }
  window.addEventListener("unhandledrejection", event => {
    const reason = event.reason && event.reason.message ? event.reason.message : String(event.reason)
    send("error", ["Unhandled Promise Rejection:", reason])
  })
})()
<\/script>
<script>
${codeStore.js}
<\/script>
</body>
</html>`
}

function renderPreview() {
  if (!state.running) return
  clearConsole()
  previewFrame.srcdoc = buildPreviewDocument()
}

function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme)
  localStorage.setItem(storageKeys.theme, theme)
}

function initTheme() {
  const savedTheme = localStorage.getItem(storageKeys.theme) || "dark"
  applyTheme(savedTheme)
}

function toggleTheme() {
  const current = document.body.getAttribute("data-theme")
  applyTheme(current === "dark" ? "light" : "dark")
}

function switchFile(file) {
  saveCurrentBuffer()
  state.activeFile = file
  localStorage.setItem(storageKeys.active, file)
  loadActiveFileIntoEditor()
}

function getAllCombinedText() {
  return [
    "index.html",
    codeStore.html,
    "",
    "style.css",
    codeStore.css,
    "",
    "script.js",
    codeStore.js
  ].join("\n")
}

async function copyText(text, button, original) {
  try {
    await navigator.clipboard.writeText(text)
    button.textContent = "Copied"
    setTimeout(() => {
      button.textContent = original
    }, 1000)
  } catch {
    button.textContent = "Failed"
    setTimeout(() => {
      button.textContent = original
    }, 1000)
  }
}

function updateRunUI() {
  if (state.running) {
    runToggleBtn.textContent = "Pause"
    previewStatus.textContent = "Live"
    modeBadge.textContent = "Running"
  } else {
    runToggleBtn.textContent = "Run"
    previewStatus.textContent = "Paused"
    modeBadge.textContent = "Paused"
  }
}

function toggleRunning() {
  state.running = !state.running
  localStorage.setItem(storageKeys.running, String(state.running))
  updateRunUI()
  if (state.running) renderPreview()
}

function resetProject() {
  codeStore.html = defaults.html
  codeStore.css = defaults.css
  codeStore.js = defaults.js
  localStorage.setItem(storageKeys.html, codeStore.html)
  localStorage.setItem(storageKeys.css, codeStore.css)
  localStorage.setItem(storageKeys.js, codeStore.js)
  clearConsole()
  loadActiveFileIntoEditor()
  renderPreview()
}

function beautifyHTML(input) {
  const tokens = input
    .replace(/>\s+</g, "><")
    .replace(/</g, "\n<")
    .replace(/\n+/g, "\n")
    .trim()
    .split("\n")
    .filter(Boolean)

  let indent = 0

  return tokens.map(token => {
    const t = token.trim()
    const closing = /^<\//.test(t)
    const selfClosing = /\/>$/.test(t) || /^<(meta|link|img|input|br|hr|source|area|base|col|embed|param|track|wbr)/i.test(t)
    const inlinePair = /^<([a-z0-9-]+)([^>]*)>.*<\/\1>$/.test(t)

    if (closing) indent = Math.max(indent - 1, 0)
    const line = `${"  ".repeat(indent)}${t}`

    if (!closing && !selfClosing && !inlinePair && /^<[^!][^>]*>$/.test(t)) indent += 1
    return line
  }).join("\n")
}

function beautifyCSS(input) {
  let text = input
    .replace(/\/\*[\s\S]*?\*\//g, match => match)
    .replace(/\s*{\s*/g, " {\n")
    .replace(/;\s*/g, ";\n")
    .replace(/\s*}\s*/g, "\n}\n")
    .replace(/,\s*/g, ", ")
    .replace(/:\s*/g, ": ")
    .replace(/\n{2,}/g, "\n")

  const lines = text.split("\n").map(line => line.trim()).filter(Boolean)
  let indent = 0

  return lines.map(line => {
    if (line.startsWith("}")) indent = Math.max(indent - 1, 0)
    const out = `${"  ".repeat(indent)}${line}`
    if (line.endsWith("{")) indent += 1
    return out
  }).join("\n")
}

function beautifyJS(input) {
  let text = input
    .replace(/\t/g, "  ")
    .replace(/;\s*/g, ";\n")
    .replace(/\{\s*/g, "{\n")
    .replace(/\}\s*/g, "}\n")
    .replace(/\n{2,}/g, "\n")
    .replace(/,\n/g, ", ")

  const lines = text.split("\n").map(line => line.trim()).filter(Boolean)
  let indent = 0

  return lines.map(line => {
    if (line.startsWith("}") || line.startsWith("];") || line.startsWith("),") || line.startsWith(")")) {
      indent = Math.max(indent - 1, 0)
    }

    const out = `${"  ".repeat(indent)}${line}`

    if (line.endsWith("{")) indent += 1
    return out
  }).join("\n")
}

function formatCurrentFile() {
  const file = state.activeFile
  let formatted = codeInput.value

  if (file === "html") formatted = beautifyHTML(formatted)
  if (file === "css") formatted = beautifyCSS(formatted)
  if (file === "js") formatted = beautifyJS(formatted)

  codeInput.value = formatted
  saveCurrentBuffer()
  updateLineNumbers()
  updateHighlighter()
  queuePreviewRender()
}

async function exportZip() {
  saveCurrentBuffer()
  const zip = new JSZip()

  zip.file("index.html", `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exported Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
${codeStore.html}
<script src="script.js"><\/script>
</body>
</html>`)
  zip.file("style.css", codeStore.css)
  zip.file("script.js", codeStore.js)

  const blob = await zip.generateAsync({ type: "blob" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "codecanvas-project.zip"
  a.click()
  URL.revokeObjectURL(url)
}

function handleInput() {
  saveCurrentBuffer()
  updateLineNumbers()
  updateHighlighter()
  queuePreviewRender()
}

function handleTabInsert(event) {
  if (event.key !== "Tab") return
  event.preventDefault()

  const start = codeInput.selectionStart
  const end = codeInput.selectionEnd
  const value = codeInput.value

  codeInput.value = value.slice(0, start) + "  " + value.slice(end)
  codeInput.selectionStart = codeInput.selectionEnd = start + 2

  handleInput()
}

function initMessageBridge() {
  window.addEventListener("message", event => {
    if (!event.data || event.data.source !== "codecanvas-console") return
    logToConsole(event.data.type || "log", Array.isArray(event.data.args) ? event.data.args : [event.data.args])
  })
}

function initSplit() {
  const saved = localStorage.getItem(storageKeys.split)
  if (saved && window.innerWidth > 960) {
    workspace.style.gridTemplateColumns = `${saved}% 10px ${100 - Number(saved)}%`
  }

  splitter.addEventListener("mousedown", () => {
    state.isDragging = true
    document.body.style.userSelect = "none"
  })

  window.addEventListener("mousemove", event => {
    if (!state.isDragging) return

    if (window.innerWidth > 960) {
      const rect = workspace.getBoundingClientRect()
      const relativeX = event.clientX - rect.left
      const percent = Math.min(72, Math.max(28, (relativeX / rect.width) * 100))
      workspace.style.gridTemplateColumns = `${percent}% 10px ${100 - percent}%`
      localStorage.setItem(storageKeys.split, String(percent))
    } else {
      const rect = workspace.getBoundingClientRect()
      const relativeY = event.clientY - rect.top
      const total = rect.height
      const percent = Math.min(72, Math.max(28, (relativeY / total) * 100))
      workspace.style.gridTemplateRows = `${percent}% 10px ${100 - percent}%`
    }
  })

  window.addEventListener("mouseup", () => {
    state.isDragging = false
    document.body.style.userSelect = ""
  })
}

function initBindings() {
  fileButtons.forEach(btn => btn.addEventListener("click", () => switchFile(btn.dataset.file)))
  tabButtons.forEach(btn => btn.addEventListener("click", () => switchFile(btn.dataset.file)))
  themeToggle.addEventListener("click", toggleTheme)
  clearBtn.addEventListener("click", resetProject)
  formatBtn.addEventListener("click", formatCurrentFile)
  copyFileBtn.addEventListener("click", () => copyText(codeInput.value, copyFileBtn, "Copy Current"))
  copyAllBtn.addEventListener("click", () => copyText(getAllCombinedText(), copyAllBtn, "Copy All"))
  runToggleBtn.addEventListener("click", toggleRunning)
  downloadZipBtn.addEventListener("click", exportZip)
  clearConsoleBtn.addEventListener("click", clearConsole)
  codeInput.addEventListener("input", handleInput)
  codeInput.addEventListener("scroll", syncScroll)
  codeInput.addEventListener("keydown", handleTabInsert)
}

function initState() {
  state.activeFile = localStorage.getItem(storageKeys.active) || "html"
  state.running = (localStorage.getItem(storageKeys.running) ?? "true") === "true"
  updateRunUI()
  loadActiveFileIntoEditor()
}

function init() {
  initTheme()
  initState()
  initBindings()
  initMessageBridge()
  initSplit()
  renderPreview()
}

init()