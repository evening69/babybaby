(() => {
  const body = document.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const lowPowerDevice =
    Boolean(navigator.connection?.saveData) ||
    Boolean(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
    Boolean(navigator.deviceMemory && navigator.deviceMemory <= 4);
  const cursorFollower = document.querySelector(".cursor-follower");
  const toast = document.querySelector(".toast");
  const secretMessage = document.querySelector(".secret-message");
  const year = document.getElementById("year");
  const countdownNodes = {
    days: document.getElementById("days"),
    hours: document.getElementById("hours"),
    minutes: document.getElementById("minutes"),
    seconds: document.getElementById("seconds"),
  };
  const progressItems = Array.from(document.querySelectorAll(".progress-item[data-progress]"));
  const revealItems = Array.from(document.querySelectorAll(".reveal"));
  const ambientLayers = Array.from(document.querySelectorAll(".ambient"));
  const featureCards = Array.from(document.querySelectorAll(".feature-card"));

  const state = {
    secretBuffer: [],
    toastTimer: null,
    secretTimer: null,
    loadStart: performance.now(),
    cursorX: 0,
    cursorY: 0,
    cursorTargetX: 0,
    cursorTargetY: 0,
    rafId: 0,
    hasCursor: !isCoarsePointer && !prefersReducedMotion.matches && !lowPowerDevice,
  };

  const launchDate = new Date();
  launchDate.setDate(launchDate.getDate() + 90);
  launchDate.setHours(0, 0, 0, 0);

  year.textContent = new Date().getFullYear();

  const showToast = (message, target = toast) => {
    if (!target) {
      return;
    }

    target.textContent = message;
    target.classList.add("is-visible");

    const timerKey = target === toast ? "toastTimer" : "secretTimer";
    clearTimeout(state[timerKey]);
    state[timerKey] = window.setTimeout(() => {
      target.classList.remove("is-visible");
    }, 2200);
  };

  const burstHearts = (count = 8) => {
    if (prefersReducedMotion.matches) {
      return;
    }

    for (let index = 0; index < count; index += 1) {
      const heart = document.createElement("span");
      heart.className = "soft-heart";
      heart.textContent = "♥";
      const x = Math.random() * 100;
      const y = 40 + Math.random() * 30;
      heart.style.setProperty("--x", `${x}vw`);
      heart.style.setProperty("--y", `${y}vh`);
      heart.style.animationDelay = `${index * 60}ms`;
      document.body.appendChild(heart);
      window.setTimeout(() => heart.remove(), 1900);
    }
  };

  const updateCountdown = () => {
    const now = new Date();
    const diff = Math.max(0, launchDate - now);
    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    countdownNodes.days.textContent = String(days).padStart(2, "0");
    countdownNodes.hours.textContent = String(hours).padStart(2, "0");
    countdownNodes.minutes.textContent = String(minutes).padStart(2, "0");
    countdownNodes.seconds.textContent = String(remainingSeconds).padStart(2, "0");
  };

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");

        if (entry.target.classList.contains("progress-item")) {
          const value = Number(entry.target.dataset.progress || 0);
          entry.target.style.setProperty("--value", value);
        }
      });
    },
    { threshold: 0.2 }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
  progressItems.forEach((item) => revealObserver.observe(item));

  const updateCursor = () => {
    if (!state.hasCursor || !cursorFollower) {
      return;
    }

    state.cursorX += (state.cursorTargetX - state.cursorX) * 0.14;
    state.cursorY += (state.cursorTargetY - state.cursorY) * 0.14;
    cursorFollower.style.transform = `translate3d(${state.cursorX - 12}px, ${state.cursorY - 12}px, 0)`;
    state.rafId = window.requestAnimationFrame(updateCursor);
  };

  const initializeCursor = () => {
    if (!state.hasCursor || !cursorFollower) {
      return;
    }

    cursorFollower.style.opacity = "1";
    const activate = () => {
      cursorFollower.style.opacity = "1";
    };

    window.addEventListener("pointermove", (event) => {
      state.cursorTargetX = event.clientX;
      state.cursorTargetY = event.clientY;
      activate();
      if (!state.rafId) {
        updateCursor();
      }
    });
  };

  const animateAmbient = () => {
    if (prefersReducedMotion.matches || lowPowerDevice) {
      return;
    }

    let ticking = false;

    const applyParallax = () => {
      const scrollDelta = window.scrollY * 0.05;
      ambientLayers.forEach((layer, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        layer.style.transform = `translate3d(0, ${scrollDelta * direction}px, 0)`;
      });
      ticking = false;
    };

    window.addEventListener(
      "scroll",
      () => {
        if (ticking) {
          return;
        }

        ticking = true;
        window.requestAnimationFrame(applyParallax);
      },
      { passive: true }
    );
  };

  const keyMap = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    a: "a",
    b: "b",
  };
  const konamiPattern = ["up", "up", "down", "down", "left", "right", "left", "right", "b", "a"];
  let konamiIndex = 0;

  const handleSecretInput = (symbol) => {
    state.secretBuffer.push(symbol);
    if (state.secretBuffer.length > 5) {
      state.secretBuffer.shift();
    }

    const joined = state.secretBuffer.join("").toLowerCase();
    if (joined.endsWith("love")) {
      burstHearts(10);
      state.secretBuffer = [];
    }

    if (joined.endsWith("hello")) {
      showToast("Hello, friend 👋");
      state.secretBuffer = [];
    }
  };

  const handleKeydown = (event) => {
    handleSecretInput(event.key);

    const mapped = keyMap[event.key];
    if (!mapped) {
      konamiIndex = 0;
      return;
    }

    if (mapped === konamiPattern[konamiIndex]) {
      konamiIndex += 1;
      if (konamiIndex === konamiPattern.length) {
        showToast("You found a secret!", secretMessage);
        konamiIndex = 0;
      }
      return;
    }

    konamiIndex = mapped === konamiPattern[0] ? 1 : 0;
  };

  const setupButtons = () => {
    document.querySelectorAll("[data-toast]").forEach((button) => {
      button.addEventListener("click", () => {
        showToast("We will let you know when it's ready.");
      });
    });
  };

  const setupLoading = () => {
    const ready = () => {
      const elapsed = performance.now() - state.loadStart;
      const remaining = Math.max(700 - elapsed, 0);
      window.setTimeout(() => body.classList.add("is-ready"), remaining);
    };

    if (document.readyState === "complete") {
      ready();
      return;
    }

    window.addEventListener("load", ready, { once: true });
  };

  const applyMotionPreference = () => {
    const reduce = prefersReducedMotion.matches;
    body.classList.toggle("no-motion", reduce);
    body.classList.toggle("effects-off", reduce || lowPowerDevice || isCoarsePointer);
    state.hasCursor = !isCoarsePointer && !reduce && !lowPowerDevice;
  };

  updateCountdown();
  window.setInterval(updateCountdown, 1000);
  setupButtons();
  setupLoading();
  applyMotionPreference();
  initializeCursor();
  animateAmbient();

  window.addEventListener("keydown", handleKeydown);
  prefersReducedMotion.addEventListener("change", applyMotionPreference);

  featureCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 70}ms`;
  });
})();
