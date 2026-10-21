/**
 * Canvas Sequence Engine
 * Handles high-performance frame rendering, memory management, preloading, and responsive cover scaling.
 */
export class CanvasSequence {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d', { alpha: false });
    this.totalFrames = options.totalFrames || 594;
    this.fps = options.fps || 20;
    this.framesDir = options.framesDir || '/frames';
    this.onProgress = options.onProgress || null;
    this.onReady = options.onReady || null;

    // Cache of HTMLImageElements
    this.images = new Array(this.totalFrames).fill(null);
    this.loadedCount = 0;
    this.currentFrameIndex = 0;
    this.targetFrameIndex = 0;
    this.isRendering = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Initial poster fallback
    this.poster = new Image();
    this.posterLoaded = false;
    this.poster.onload = () => {
      this.posterLoaded = true;
      if (this.currentFrameIndex === 0 && !this.images[0]) {
        this.renderImage(this.poster);
      }
    };
    this.poster.src = '/poster.webp';

    this.handleResize = this.handleResize.bind(this);
    this.renderLoop = this.renderLoop.bind(this);
  }

  init() {
    this.handleResize();
    window.addEventListener('resize', this.handleResize, { passive: true });
    this.startPreload();
  }

  handleResize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);

    // Redraw immediately with current frame
    this.requestDraw(this.currentFrameIndex);
  }

  getFrameUrl(index) {
    const num = String(index + 1).padStart(5, '0');
    return `${this.framesDir}/frame_${num}.webp`;
  }

  startPreload() {
    // Phase 1: Load initial priority frames (first 30 frames) immediately
    const priorityCount = Math.min(30, this.totalFrames);
    let priorityLoaded = 0;

    // Also load final frame immediately for smooth hero settle
    this.loadSingleFrame(this.totalFrames - 1);

    for (let i = 0; i < priorityCount; i++) {
      this.loadSingleFrame(i, () => {
        priorityLoaded++;
        if (this.onProgress) {
          const ratio = Math.min(priorityLoaded / priorityCount, 1);
          this.onProgress(ratio * 0.4);
        }
        if (priorityLoaded === priorityCount) {
          if (this.onReady) this.onReady();
          // Phase 2: Progressively load remaining frames in background
          this.loadRemainingFrames(priorityCount);
        }
      });
    }
  }

  loadSingleFrame(index, callback) {
    if (index < 0 || index >= this.totalFrames) return;
    if (this.images[index]) {
      if (callback) callback();
      return;
    }

    const img = new Image();
    img.onload = () => {
      this.images[index] = img;
      this.loadedCount++;
      if (index === this.targetFrameIndex) {
        this.requestDraw(index);
      }
      if (callback) callback();
    };
    img.onerror = () => {
      if (callback) callback();
    };
    img.src = this.getFrameUrl(index);
  }

  loadRemainingFrames(startIndex) {
    let nextIndex = startIndex;
    const batchSize = 16;

    const loadNextBatch = () => {
      if (nextIndex >= this.totalFrames) {
        if (this.onProgress) this.onProgress(1.0);
        return;
      }

      const end = Math.min(nextIndex + batchSize, this.totalFrames);
      let batchDone = 0;
      const count = end - nextIndex;

      for (let i = nextIndex; i < end; i++) {
        this.loadSingleFrame(i, () => {
          batchDone++;
          if (batchDone === count) {
            nextIndex = end;
            if (this.onProgress) {
              const totalRatio = 0.4 + (this.loadedCount / this.totalFrames) * 0.6;
              this.onProgress(totalRatio);
            }
            setTimeout(loadNextBatch, 8);
          }
        });
      }
    };

    loadNextBatch();
  }

  /**
   * Seek image sequence by normalized progress (0.0 to 1.0)
   */
  seek(progress) {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    const targetIndex = Math.round(clampedProgress * (this.totalFrames - 1));
    if (targetIndex !== this.targetFrameIndex) {
      this.targetFrameIndex = targetIndex;
      // If frame isn't loaded yet, immediately load it and neighbors
      if (!this.images[targetIndex]) {
        this.loadSingleFrame(targetIndex, () => this.requestDraw(targetIndex));
        for (let d = -2; d <= 4; d++) {
          const n = targetIndex + d;
          if (n >= 0 && n < this.totalFrames && !this.images[n]) {
            this.loadSingleFrame(n);
          }
        }
      }
      this.requestDraw(targetIndex);
    }
  }

  requestDraw(index) {
    this.targetFrameIndex = index;
    if (!this.isRendering) {
      this.isRendering = true;
      requestAnimationFrame(this.renderLoop);
    }
  }

  renderLoop() {
    this.isRendering = false;
    const idx = this.targetFrameIndex;
    this.currentFrameIndex = idx;

    // Find closest loaded image to avoid flashing blank screens
    let imgToDraw = this.images[idx];
    if (!imgToDraw) {
      // Look backward for nearest loaded frame
      for (let b = idx - 1; b >= 0; b--) {
        if (this.images[b]) {
          imgToDraw = this.images[b];
          break;
        }
      }
      // If none backward, look forward
      if (!imgToDraw) {
        for (let f = idx + 1; f < this.totalFrames; f++) {
          if (this.images[f]) {
            imgToDraw = this.images[f];
            break;
          }
        }
      }
      // Fallback to poster
      if (!imgToDraw && this.posterLoaded) {
        imgToDraw = this.poster;
      }
    }

    if (imgToDraw) {
      this.renderImage(imgToDraw);
    }
  }

  renderImage(img) {
    if (!img.naturalWidth || !img.naturalHeight) return;

    const cw = this.canvas.width;
    const ch = this.canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    // Cover math
    const scale = Math.max(cw / iw, ch / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const cx = (cw - nw) * 0.5;
    const cy = (ch - nh) * 0.5;

    this.ctx.drawImage(img, 0, 0, iw, ih, cx, cy, nw, nh);
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.images = [];
  }
}
