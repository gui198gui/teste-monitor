/*
 * Teste de Monitor — testes de ecrã que correm no browser.
 * Autor: Guilherme Martins (github.com/gui198gui)
 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const stage = $("stage");
  const canvas = $("canvas");
  const ctx = canvas.getContext("2d");
  const layer = $("layer");
  const hud = $("hud");

  const COMMON_HZ = [24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 155, 160, 165, 170, 175, 180, 200, 240, 280, 300, 360, 480, 500, 540];

  function snapHz(hz) {
    const near = COMMON_HZ.find((c) => Math.abs(hz - c) / c < 0.03);
    return near ?? Math.round(hz);
  }

  const median = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    return s[Math.floor(s.length / 2)];
  };

  /* =======================================================================
   * Informação do ecrã (página inicial)
   * ===================================================================== */
  function screenInfo() {
    const dpr = window.devicePixelRatio || 1;
    $("i-res").textContent = `${Math.round(screen.width * dpr)} × ${Math.round(screen.height * dpr)}`;
    $("i-dpr").textContent = `${Math.round(dpr * 100)}%`;
    $("i-depth").textContent = `${screen.colorDepth} bits`;
    $("i-hdr").textContent = matchMedia("(dynamic-range: high)").matches ? "Suportado" : "Não detetado";
  }

  function measureHz(durationMs = 1500) {
    return new Promise((resolve) => {
      const deltas = [];
      let last = null;
      const start = performance.now();
      const tick = (t) => {
        if (last !== null) deltas.push(t - last);
        last = t;
        if (t - start < durationMs) requestAnimationFrame(tick);
        else resolve(deltas.length ? 1000 / median(deltas) : 0);
      };
      requestAnimationFrame(tick);
    });
  }

  screenInfo();
  window.addEventListener("resize", screenInfo);
  measureHz().then((hz) => ($("i-hz").textContent = hz ? `${snapHz(hz)} Hz` : "—"));

  /* =======================================================================
   * Canvas em píxeis físicos (para os padrões de 1 píxel ficarem certos)
   * ===================================================================== */
  function fitCanvas() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    return { w: canvas.width, h: canvas.height, dpr };
  }

  const fill = (color) => (c, w, h) => {
    c.fillStyle = color;
    c.fillRect(0, 0, w, h);
  };

  /* =======================================================================
   * Definição dos testes
   * Cada passo tem: título, texto e draw(ctx, w, h, dpr).
   * Testes animados têm start()/stop() próprios.
   * ===================================================================== */
  const TESTS = {
    cores: {
      steps: [
        { title: "Preto", text: "Um ponto <b>aceso</b> (branco ou de cor) é um píxel preso.", draw: fill("#000") },
        { title: "Branco", text: "Um ponto <b>preto</b> é um píxel morto. Um ponto de cor é um subpíxel preso.", draw: fill("#fff") },
        { title: "Vermelho", text: "Procura pontos pretos, verdes ou azuis.", draw: fill("#f00") },
        { title: "Verde", text: "Procura pontos pretos, vermelhos ou azuis.", draw: fill("#0f0") },
        { title: "Azul", text: "Procura pontos pretos, vermelhos ou verdes.", draw: fill("#00f") },
        { title: "Ciano", text: "Ponto vermelho aqui = subpíxel vermelho preso.", draw: fill("#0ff") },
        { title: "Magenta", text: "Ponto verde aqui = subpíxel verde preso.", draw: fill("#f0f") },
        { title: "Amarelo", text: "Ponto azul aqui = subpíxel azul preso.", draw: fill("#ff0") },
        { title: "Cinzento 50%", text: "Pontos claros ou escuros que não desapareçam ao mudar de cor são píxeis com defeito.", draw: fill("#808080") },
      ],
    },

    uniformidade: {
      steps: [
        { title: "Preto: backlight bleed", text: "Escurece o quarto e põe o brilho no máximo. Zonas mais claras nos <b>cantos e bordas</b> são fugas de luz (backlight bleed). Brilho que muda quando mexes a cabeça é IPS glow (normal em IPS).", draw: fill("#000") },
        { title: "Cinzento 5%", text: "Manchas mais claras (clouding) ficam bem visíveis em tons muito escuros.", draw: fill("rgb(13,13,13)") },
        { title: "Cinzento 10%", text: "Procura manchas, faixas verticais ou zonas com cor diferente.", draw: fill("rgb(26,26,26)") },
        { title: "Cinzento 25%", text: "Faixas verticais que se mexem com a imagem são o efeito \"dirty screen\" (DSE).", draw: fill("rgb(64,64,64)") },
        { title: "Cinzento 50%", text: "O ecrã deve parecer igual de ponta a ponta. Cantos mais escuros = má uniformidade.", draw: fill("rgb(128,128,128)") },
        { title: "Cinzento 75%", text: "Tons amarelados ou rosados numa zona indicam uniformidade de cor fraca.", draw: fill("rgb(191,191,191)") },
      ],
    },

    gradiente: {
      steps: [
        {
          title: "Gradiente cinzento",
          text: "Deve ser uma transição <b>suave</b>. \"Degraus\" ou faixas bem marcadas = banding (pouca profundidade de cor ou processamento do monitor).",
          draw(c, w, h) {
            const g = c.createLinearGradient(0, 0, w, 0);
            g.addColorStop(0, "#000");
            g.addColorStop(1, "#fff");
            c.fillStyle = g;
            c.fillRect(0, 0, w, h);
          },
        },
        {
          title: "Gradientes de cor",
          text: "Cada faixa deve ir do preto à cor máxima sem degraus nem tons estranhos.",
          draw(c, w, h) {
            ["#fff", "#f00", "#0f0", "#00f"].forEach((color, i) => {
              const g = c.createLinearGradient(0, 0, w, 0);
              g.addColorStop(0, "#000");
              g.addColorStop(1, color);
              c.fillStyle = g;
              c.fillRect(0, (h / 4) * i, w, h / 4 + 1);
            });
          },
        },
        {
          title: "Gradiente escuro (0–25%)",
          text: "Nos tons escuros o banding nota-se mais. Algumas faixas são normais em monitores de 8 bits.",
          draw(c, w, h) {
            const g = c.createLinearGradient(0, 0, w, 0);
            g.addColorStop(0, "rgb(0,0,0)");
            g.addColorStop(1, "rgb(64,64,64)");
            c.fillStyle = g;
            c.fillRect(0, 0, w, h);
          },
        },
        {
          title: "32 degraus",
          text: "Deves conseguir distinguir <b>todos</b> os 32 degraus, do mais escuro ao mais claro.",
          draw(c, w, h) {
            const n = 32;
            for (let i = 0; i < n; i++) {
              const v = Math.round((i / (n - 1)) * 255);
              c.fillStyle = `rgb(${v},${v},${v})`;
              c.fillRect(Math.floor((w / n) * i), 0, Math.ceil(w / n), h);
            }
          },
        },
      ],
    },

    contraste: {
      steps: [
        {
          title: "Nível de preto",
          text: "Deverias distinguir os quadrados a partir do <b>3–5</b>. Se não vês os primeiros, aumenta o brilho; se o fundo parece cinzento, o preto está \"lavado\".",
          draw: (c, w, h, dpr) => levels(c, w, h, dpr, 0, Array.from({ length: 20 }, (_, i) => i + 1), "#fff"),
        },
        {
          title: "Nível de branco",
          text: "Deverias distinguir até ao <b>250–253</b>. Se os últimos se misturam com o fundo, baixa o contraste.",
          draw: (c, w, h, dpr) => levels(c, w, h, dpr, 255, Array.from({ length: 20 }, (_, i) => 235 + i), "#000"),
        },
      ],
    },

    nitidez: {
      steps: [
        {
          title: "Xadrez de 1 píxel",
          text: "À distância normal deve parecer um <b>cinzento uniforme</b>. Ondulações ou padrões (moiré) indicam que não estás na resolução nativa ou que a escala está a desfocar.",
          draw(c, w, h) {
            const img = c.createImageData(w, h);
            const d = img.data;
            for (let y = 0; y < h; y++) {
              for (let x = 0; x < w; x++) {
                const v = (x + y) & 1 ? 255 : 0;
                const i = (y * w + x) * 4;
                d[i] = d[i + 1] = d[i + 2] = v;
                d[i + 3] = 255;
              }
            }
            c.putImageData(img, 0, 0);
          },
        },
        {
          title: "Linhas de 1 píxel",
          text: "As linhas devem estar <b>nítidas e separadas</b>. Linhas cinzentas ou que se fundem indicam escala ou nitidez (sharpness) mal configurada.",
          draw(c, w, h) {
            c.fillStyle = "#000";
            c.fillRect(0, 0, w, h);
            c.fillStyle = "#fff";
            for (let x = 0; x < w / 2; x += 2) c.fillRect(x, 0, 1, h);
            for (let y = 0; y < h; y += 2) c.fillRect(Math.floor(w / 2), y, Math.ceil(w / 2), 1);
          },
        },
        {
          title: "Texto",
          text: "O texto pequeno deve ler-se sem contornos coloridos nem desfocagem. Se estiver mau, ativa o ClearType (Windows) e confirma a resolução nativa.",
          draw(c, w, h, dpr) {
            c.fillStyle = "#fff";
            c.fillRect(0, 0, w, h);
            c.fillStyle = "#000";
            c.textBaseline = "top";
            let y = 40 * dpr;
            for (const size of [8, 9, 10, 11, 12, 14, 16, 20, 24, 32]) {
              c.font = `${size * dpr}px system-ui, Segoe UI, sans-serif`;
              c.fillText(`${size}px · O rápido zorro castanho salta sobre o cão preguiçoso. 0123456789 Ilil1|`, 40 * dpr, y);
              y += (size + 14) * dpr;
            }
          },
        },
      ],
    },

    hz: { custom: true, steps: [{ title: "Taxa de atualização real", text: "Mantém esta janela em primeiro plano e não mexas em nada durante uns segundos." }] },

    movimento: {
      custom: true,
      steps: [
        { title: "Ghosting em fundo cinzento", text: "Rasto <b>atrás</b> do objeto = ghosting (tempo de resposta lento). Contorno claro ou colorido = overshoot (Overdrive alto demais). Experimenta os níveis de Overdrive no menu do monitor.", bg: "#7f7f7f" },
        { title: "Ghosting em fundo escuro", text: "Em fundos escuros o \"black smearing\" (rasto escuro) é típico dos painéis VA.", bg: "#141414" },
        { title: "Frames saltados", text: "Tira uma foto ao ecrã com o telemóvel (exposição de ~1/10 s): devem aparecer <b>caixas seguidas</b> acesas. Caixas em falta = frames saltados (frame skipping).", bg: "#000", skip: true },
      ],
    },

    reparar: { custom: true, warn: true, steps: [{ title: "Reparar píxel preso", text: "Arrasta o quadrado para cima do píxel preso e deixa-o a piscar <b>10–20 minutos</b>. Pode resolver píxeis presos (de cor), mas não píxeis mortos (pretos). <b>+ / −</b> tamanho · <b>F</b> piscar o ecrã todo" }] },
  };

  function levels(c, w, h, dpr, bg, values, labelColor) {
    c.fillStyle = `rgb(${bg},${bg},${bg})`;
    c.fillRect(0, 0, w, h);
    const cols = 10;
    const size = Math.min(w / (cols + 2), h / 5);
    const gap = size * 0.15;
    const total = cols * size;
    const x0 = (w - total) / 2;
    const y0 = h / 2 - size - gap;
    c.font = `${12 * dpr}px system-ui, sans-serif`;
    c.textAlign = "center";
    values.forEach((v, i) => {
      const x = x0 + (i % cols) * size;
      const y = y0 + Math.floor(i / cols) * (size + gap * 3);
      c.fillStyle = `rgb(${v},${v},${v})`;
      c.fillRect(x + gap / 2, y, size - gap, size - gap);
      c.fillStyle = labelColor;
      c.globalAlpha = 0.6;
      c.fillText(String(v), x + size / 2, y + size + 2 * dpr);
      c.globalAlpha = 1;
    });
    c.textAlign = "start";
  }

  /* =======================================================================
   * Motor dos testes
   * ===================================================================== */
  const state = { id: null, step: 0, raf: 0, cleanup: [], hudTimer: 0, idleTimer: 0, hudHidden: false };

  function start(id) {
    const test = TESTS[id];
    if (test.warn) {
      $("warn").hidden = false;
      $("warn-ok").onclick = () => {
        $("warn").hidden = true;
        open(id);
      };
      $("warn-cancel").onclick = () => ($("warn").hidden = true);
      return;
    }
    open(id);
  }

  function open(id) {
    state.id = id;
    state.step = 0;
    state.hudHidden = false;
    stage.hidden = false;
    document.body.style.overflow = "hidden";
    if (stage.requestFullscreen && !document.fullscreenElement) {
      stage.requestFullscreen().catch(() => {}); // pode falhar (ex: iPhone); o teste continua na janela
    }
    render();
    wake();
  }

  function close() {
    stopAnimation();
    state.id = null;
    stage.hidden = true;
    stage.classList.remove("idle", "nocursor");
    document.body.style.overflow = "";
    layer.innerHTML = "";
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  function stopAnimation() {
    cancelAnimationFrame(state.raf);
    state.cleanup.forEach((fn) => fn());
    state.cleanup = [];
  }

  function render() {
    stopAnimation();
    layer.innerHTML = "";
    const test = TESTS[state.id];
    const step = test.steps[state.step];
    const { w, h, dpr } = fitCanvas();

    $("hud-title").textContent = test.steps.length > 1 ? `${step.title} (${state.step + 1}/${test.steps.length})` : step.title;
    $("hud-text").innerHTML = step.text;

    if (!test.custom) {
      step.draw(ctx, w, h, dpr);
    } else if (state.id === "hz") {
      runHz();
    } else if (state.id === "movimento") {
      runMotion(step);
    } else if (state.id === "reparar") {
      runFixer();
    }
    showHud();
  }

  function go(delta) {
    const n = TESTS[state.id].steps.length;
    const next = state.step + delta;
    if (next < 0 || next >= n) return;
    state.step = next;
    render();
  }

  /* ---------- Instruções (HUD) e cursor ---------- */
  function showHud() {
    if (state.hudHidden) return;
    hud.classList.remove("hide");
    clearTimeout(state.hudTimer);
    if (state.id !== "hz") state.hudTimer = setTimeout(() => hud.classList.add("hide"), 6000);
  }

  function wake() {
    stage.classList.remove("idle", "nocursor");
    clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(() => stage.classList.add("idle", "nocursor"), 2500);
  }

  stage.addEventListener("mousemove", () => {
    wake();
    if (!state.hudHidden) showHud();
  });

  stage.addEventListener("click", (e) => {
    if (e.target.closest("#exit, .fixer, #hud")) return;
    if (state.id === "hz" || state.id === "reparar") return;
    go(1);
  });

  $("exit").addEventListener("click", close);

  document.addEventListener("keydown", (e) => {
    if (!state.id) return;
    const k = e.key;
    if (k === "Escape") return close();
    if (k === "ArrowRight" || k === " " || k === "PageDown") { e.preventDefault(); go(1); }
    if (k === "ArrowLeft" || k === "PageUp") { e.preventDefault(); go(-1); }
    if (k === "h" || k === "H") {
      state.hudHidden = !state.hudHidden;
      hud.classList.toggle("hide", state.hudHidden);
      if (!state.hudHidden) showHud();
    }
  });

  // Sair do ecrã inteiro com Esc (o browser trata a tecla) também fecha o teste
  document.addEventListener("fullscreenchange", () => {
    if (!document.fullscreenElement && state.id) close();
  });

  window.addEventListener("resize", () => {
    if (state.id && !TESTS[state.id].custom) render();
  });

  document.querySelectorAll(".test").forEach((btn) => btn.addEventListener("click", () => start(btn.dataset.test)));

  /* =======================================================================
   * Teste: Hz reais
   * ===================================================================== */
  function runHz() {
    ctx.fillStyle = "#0d0f14";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    layer.innerHTML = `
      <div class="hz-panel">
        <div class="hz-big"><span id="hz-val">…</span> <small>Hz</small></div>
        <div class="hz-stats">
          <div>Tempo por frame<b id="hz-ft">—</b></div>
          <div>Frames perdidos<b id="hz-drop">0</b></div>
          <div>Estabilidade<b id="hz-jit">—</b></div>
        </div>
        <canvas class="hz-graph" id="hz-graph"></canvas>
        <p class="hz-note">Se o valor for mais baixo do que o do teu monitor (ex: <b>60 Hz num monitor de 144 Hz</b>),
          vai a <b>Definições → Sistema → Ecrã → Ecrã avançado</b> e escolhe a taxa máxima.
          Confirma também o cabo: DisplayPort ou HDMI 2.0+. Frames perdidos com o PC parado podem indicar
          problemas de drivers ou de cabo.</p>
      </div>`;

    const graph = $("hz-graph");
    const gctx = graph.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    graph.width = graph.clientWidth * dpr;
    graph.height = graph.clientHeight * dpr;

    const deltas = [];
    let last = null;
    let frames = 0;
    let dropped = 0;
    let lastUi = 0;

    const tick = (t) => {
      if (last !== null) {
        const d = t - last;
        deltas.push(d);
        if (deltas.length > 240) deltas.shift();
        frames++;
        if (frames > 60) {
          const med = median(deltas);
          if (d > med * 1.5) dropped += Math.round(d / med) - 1;
        }
      }
      last = t;

      if (t - lastUi > 250 && deltas.length > 20) {
        lastUi = t;
        const med = median(deltas);
        const hz = 1000 / med;
        const sd = Math.sqrt(deltas.reduce((s, x) => s + (x - med) ** 2, 0) / deltas.length);
        $("hz-val").textContent = snapHz(hz);
        $("hz-ft").textContent = `${med.toFixed(2).replace(".", ",")} ms`;
        $("hz-drop").textContent = String(dropped);
        $("hz-jit").textContent = sd < med * 0.1 ? "Boa" : sd < med * 0.3 ? "Razoável" : "Instável";
        drawGraph(gctx, graph.width, graph.height, deltas, med);
      }
      state.raf = requestAnimationFrame(tick);
    };

    // Recomeça a contagem se a janela perder o foco (o browser abranda as animações)
    const onVis = () => { last = null; frames = 0; dropped = 0; deltas.length = 0; };
    document.addEventListener("visibilitychange", onVis);
    state.cleanup.push(() => document.removeEventListener("visibilitychange", onVis));
    state.raf = requestAnimationFrame(tick);
  }

  function drawGraph(g, w, h, deltas, med) {
    g.clearRect(0, 0, w, h);
    const max = med * 3;
    g.strokeStyle = "rgba(255,255,255,.15)";
    g.beginPath();
    g.moveTo(0, h - (med / max) * h);
    g.lineTo(w, h - (med / max) * h);
    g.stroke();
    g.strokeStyle = "#3dd68c";
    g.lineWidth = 1.5;
    g.beginPath();
    deltas.forEach((d, i) => {
      const x = (i / 239) * w;
      const y = h - Math.min(d / max, 1) * h;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    });
    g.stroke();
  }

  /* =======================================================================
   * Teste: ghosting / motion blur / frames saltados
   * ===================================================================== */
  function runMotion(step) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width;
    const h = canvas.height;
    const speeds = [960, 480, 240]; // píxeis (CSS) por segundo
    const size = 64 * dpr;
    let t0 = null;
    let lastT = null;
    let fps = 0;
    let frame = 0;

    const drawUfo = (x, y) => {
      ctx.fillStyle = "#4cc3ff";
      ctx.beginPath();
      ctx.ellipse(x + size / 2, y + size * 0.62, size / 2, size * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#e7ebf2";
      ctx.beginPath();
      ctx.ellipse(x + size / 2, y + size * 0.45, size * 0.22, size * 0.2, 0, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = "#0d0f14";
      [0.3, 0.5, 0.7].forEach((f) => ctx.fillRect(x + size * f - 2 * dpr, y + size * 0.58, 4 * dpr, 4 * dpr));
    };

    const tick = (t) => {
      if (t0 === null) t0 = t;
      if (lastT !== null) fps = fps ? fps * 0.95 + (1000 / (t - lastT)) * 0.05 : 1000 / (t - lastT);
      lastT = t;
      frame++;
      const sec = (t - t0) / 1000;

      ctx.fillStyle = step.bg;
      ctx.fillRect(0, 0, w, h);

      if (step.skip) {
        const n = 16;
        const box = Math.min(w / (n + 2), 80 * dpr);
        const x0 = (w - box * n) / 2;
        const y = h / 2 - box / 2;
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = i === frame % n ? "#fff" : "#1b1f27";
          ctx.fillRect(x0 + i * box + 2, y, box - 4, box);
        }
      } else {
        const lane = h / (speeds.length + 1);
        ctx.font = `${13 * dpr}px system-ui, sans-serif`;
        speeds.forEach((v, i) => {
          const travel = w + size;
          const x = ((sec * v * dpr) % travel) - size;
          const y = lane * (i + 1) - size / 2;
          drawUfo(x, y);
          ctx.fillStyle = step.bg === "#7f7f7f" ? "#1a1a1a" : "#8f99aa";
          const ppf = fps ? Math.round(v / fps) : 0;
          ctx.fillText(`${v} px/s · ${ppf} px/frame`, 20 * dpr, y - 10 * dpr);
        });
      }
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);
  }

  /* =======================================================================
   * Teste: reparar píxel preso
   * ===================================================================== */
  function runFixer() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const box = document.createElement("canvas");
    box.className = "fixer";
    let size = 120;
    let full = false;
    const place = (x, y) => {
      box.style.left = `${Math.max(0, Math.min(innerWidth - size, x))}px`;
      box.style.top = `${Math.max(0, Math.min(innerHeight - size, y))}px`;
    };
    const resize = () => {
      box.style.width = box.style.height = `${size}px`;
      box.width = box.height = 1;
    };
    resize();
    place(innerWidth / 2 - size / 2, innerHeight / 2 - size / 2);
    layer.appendChild(box);

    // Arrastar
    let drag = null;
    box.addEventListener("pointerdown", (e) => {
      drag = { dx: e.clientX - box.offsetLeft, dy: e.clientY - box.offsetTop };
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener("pointermove", (e) => drag && place(e.clientX - drag.dx, e.clientY - drag.dy));
    box.addEventListener("pointerup", () => (drag = null));

    const onKey = (e) => {
      if (e.key === "+" || e.key === "=") { size = Math.min(600, size + 20); resize(); place(box.offsetLeft, box.offsetTop); }
      if (e.key === "-" || e.key === "_") { size = Math.max(20, size - 20); resize(); place(box.offsetLeft, box.offsetTop); }
      if (e.key === "f" || e.key === "F") { full = !full; box.hidden = full; if (!full) { ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height); } }
    };
    document.addEventListener("keydown", onKey);
    state.cleanup.push(() => document.removeEventListener("keydown", onKey));

    const colors = ["#f00", "#0f0", "#00f", "#fff", "#000"];
    const bctx = box.getContext("2d");
    const tick = () => {
      const c = colors[(Math.random() * colors.length) | 0];
      if (full) {
        ctx.fillStyle = c;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        bctx.fillStyle = c;
        bctx.fillRect(0, 0, 1, 1);
      }
      state.raf = requestAnimationFrame(tick);
    };
    state.raf = requestAnimationFrame(tick);
  }

  /* =======================================================================
   * Funcionamento offline (PWA)
   * ===================================================================== */
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // Permite abrir um teste diretamente: ...#cores, #hz, etc.
  const fromHash = location.hash.slice(1);
  if (TESTS[fromHash] && !TESTS[fromHash].warn) {
    // Sem gesto do utilizador o browser não deixa entrar em ecrã inteiro; abre na janela.
    open(fromHash);
  }

  // Exposto para testes automáticos
  window.__monitorTest = { TESTS, open, close, go, snapHz };
})();
