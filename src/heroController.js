import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export class HeroController {
  constructor(canvasSequence) {
    this.canvasSeq = canvasSequence;

    // DOM Elements
    this.container = document.getElementById('hero-scroll-container');
    this.pinnedViewport = document.getElementById('hero-pinned-viewport');
    this.contentLayer = document.getElementById('hero-content-layer');
    this.bgWrap = document.getElementById('hero-bg-crossfade-wrap');

    // Stage Narrative Elements (Phase 1: Left-Middle, Phase 2: Right-Middle, Phase 3: Bottom-Beneath)
    this.stagePhase1 = document.getElementById('stage-phase-1');
    this.stagePhase2 = document.getElementById('stage-phase-2');
    this.stagePhase3 = document.getElementById('stage-phase-3');

    // Toggle Elements
    this.toggleContainer = document.querySelector('.service-toggle-container');
    this.btnHeizung = document.getElementById('btn-toggle-heizung');
    this.btnSanitaer = document.getElementById('btn-toggle-sanitaer');

    // Direct Service Content Elements (No Card)
    this.serviceContent = document.getElementById('service-direct-content');
    this.serviceHeading = document.getElementById('service-direct-heading');
    this.serviceDesc = document.getElementById('service-direct-desc');
    this.serviceCta = document.getElementById('service-direct-cta');
    this.serviceCtaLabel = document.getElementById('service-cta-label');

    // Scroll Guidance Tracker
    this.scrollThumb = document.getElementById('scroll-tracker-thumb');

    // State (Sanitär is the initial state, matching video conclusion)
    this.currentMode = 'sanitaer';
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.initToggle();
    this.initScrollTimeline();
  }

  initToggle() {
    this.btnSanitaer.addEventListener('click', (e) => {
      e.preventDefault();
      this.setServiceMode('sanitaer');
    });

    this.btnHeizung.addEventListener('click', (e) => {
      e.preventDefault();
      this.setServiceMode('heizung');
    });
  }

  setServiceMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;

    // 1. Crossfade the entire full-screen hero background
    if (this.bgWrap) {
      if (mode === 'heizung') {
        this.bgWrap.classList.add('heizung-mode');
      } else {
        this.bgWrap.classList.remove('heizung-mode');
      }
    }

    if (mode === 'sanitaer') {
      // Toggle button states (cyan active treatment on Sanitär)
      this.btnSanitaer.classList.add('active');
      this.btnSanitaer.setAttribute('aria-selected', 'true');
      this.btnHeizung.classList.remove('active');
      this.btnHeizung.setAttribute('aria-selected', 'false');
      this.toggleContainer.classList.remove('heizung-active');

      // Subtle fade & reveal for direct service text
      if (this.serviceContent) {
        this.serviceContent.classList.add('transitioning');
        setTimeout(() => {
          this.serviceContent.classList.remove('heizung-theme');
          this.serviceHeading.textContent = 'Wasser, das Lebensqualität schafft.';
          this.serviceDesc.textContent =
            'Moderne Sanitärlösungen, hochwertige Badgestaltung und zuverlässige Wassertechnik für Ihr Zuhause.';
          this.serviceCtaLabel.textContent = 'Mehr zu Sanitär';
          this.serviceCta.setAttribute('aria-label', 'Mehr zu Sanitär');
          this.serviceContent.classList.remove('transitioning');
        }, 180);
      }
    } else {
      // Toggle button states (amber active treatment on Heizung)
      this.btnHeizung.classList.add('active');
      this.btnHeizung.setAttribute('aria-selected', 'true');
      this.btnSanitaer.classList.remove('active');
      this.btnSanitaer.setAttribute('aria-selected', 'false');
      this.toggleContainer.classList.add('heizung-active');

      // Subtle fade & reveal for direct service text
      if (this.serviceContent) {
        this.serviceContent.classList.add('transitioning');
        setTimeout(() => {
          this.serviceContent.classList.add('heizung-theme');
          this.serviceHeading.textContent = 'Wärme, die sich zuhause anfühlt.';
          this.serviceDesc.textContent =
            'Moderne Heizsysteme, Wärmepumpen und intelligente Temperaturregelung für spürbaren Komfort in jedem Raum.';
          this.serviceCtaLabel.textContent = 'Mehr zur Heizung';
          this.serviceCta.setAttribute('aria-label', 'Mehr zur Heizung');
          this.serviceContent.classList.remove('transitioning');
        }, 180);
      }
    }
  }

  initScrollTimeline() {
    if (this.isReducedMotion) {
      // Reduced motion: reveal final hero immediately
      this.canvasSeq.seek(1.0);
      this.contentLayer.classList.add('active');
      if (this.bgWrap) this.bgWrap.classList.add('active');
      return;
    }

    // Single unified ScrollTrigger with explicit pinning
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.container,
      pin: this.pinnedViewport,
      start: 'top top',
      end: 'bottom bottom',
      pinSpacing: false,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;

        // 1. Scrub Frame Sequence (0.00 to 0.78 maps to frame 0 to end)
        const frameProgress = Math.min(progress / 0.78, 1.0);
        this.canvasSeq.seek(frameProgress);

        // 2. Update Scroll Guidance Tracker Thumb
        if (this.scrollThumb) {
          this.scrollThumb.style.left = `${Math.round(progress * 100)}%`;
        }

        // 3. Narrative Cues during State A: Left (Phase 1) -> Right (Phase 2) -> Bottom (Phase 3)
        // Phase 1 starts already visible on page load and remains until 0.23
        const inPhase1 = progress < 0.23;
        const inPhase2 = progress >= 0.25 && progress < 0.47;
        const inPhase3 = progress >= 0.49 && progress < 0.71;

        if (this.stagePhase1) {
          if (inPhase1) this.stagePhase1.classList.add('visible');
          else this.stagePhase1.classList.remove('visible');
        }
        if (this.stagePhase2) {
          if (inPhase2) this.stagePhase2.classList.add('visible');
          else this.stagePhase2.classList.remove('visible');
        }
        if (this.stagePhase3) {
          if (inPhase3) this.stagePhase3.classList.add('visible');
          else this.stagePhase3.classList.remove('visible');
        }

        // 4. Transition to Final Hero (State B & C: 0.72 to 1.0)
        if (progress >= 0.72) {
          this.contentLayer.classList.add('active');
          if (this.bgWrap) this.bgWrap.classList.add('active');
        } else {
          this.contentLayer.classList.remove('active');
          if (this.bgWrap) this.bgWrap.classList.remove('active');
        }
      }
    });
  }

  destroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
    }
  }
}
