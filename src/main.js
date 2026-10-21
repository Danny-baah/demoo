import { CanvasSequence } from './canvasSequence.js';
import { HeroController } from './heroController.js';

window.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('hero-canvas');
  const loader = document.getElementById('hero-loader');
  const progressBar = document.getElementById('loader-progress-bar');
  const statusText = document.getElementById('loader-status');

  // Load frames metadata
  let totalFrames = 594;
  let fps = 20;

  try {
    const res = await fetch('/frames_meta.json');
    if (res.ok) {
      const meta = await res.json();
      totalFrames = meta.totalFrames || totalFrames;
      fps = meta.fps || fps;
    }
  } catch (err) {
    console.warn('Metadata fetch fallback:', err);
  }

  // Initialize Canvas Sequence Engine
  const canvasSequence = new CanvasSequence(canvas, {
    totalFrames,
    fps,
    framesDir: '/frames',
    onProgress: (ratio) => {
      if (progressBar) {
        const pct = Math.round(ratio * 100);
        progressBar.style.width = `${pct}%`;
      }
    },
    onReady: () => {
      // First 30 frames ready -> reveal experience instantly
      if (statusText) statusText.textContent = 'Bereit';
      setTimeout(() => {
        if (loader) loader.classList.add('loaded');
      }, 300);
    }
  });

  canvasSequence.init();

  // Initialize Hero Controller (GSAP ScrollTrigger & Toggle State)
  const heroController = new HeroController(canvasSequence);

  // Safety fallback if preloading takes too long
  setTimeout(() => {
    if (loader && !loader.classList.contains('loaded')) {
      loader.classList.add('loaded');
    }
  }, 2500);

  // Smooth hash navigation for internal links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });
});
