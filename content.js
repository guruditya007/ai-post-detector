/**
 * AI Post Detector — Firefox Extension
 * Author: Guruditya Sinha <guruditya007@gmail.com>
 * GitHub: https://github.com/guruditya007
 * License: MIT
 */

browser.runtime.onMessage.addListener((msg) => {
  if (msg.action === "showLoading") showPanel(null, msg.text, true);
  if (msg.action === "showResult") showPanel(msg.result, msg.text, false);
  if (msg.action === "showError") showError(msg.error);
});

function removeExisting() {
  const old = document.getElementById("__ai_detector_panel");
  if (old) old.remove();
}

function getSelectionPosition() {
  const PANEL_WIDTH = 340;
  const PANEL_HEIGHT = 280; // estimated
  const MARGIN = 12;

  const sel = window.getSelection();
  const rect = (sel && sel.rangeCount > 0)
    ? sel.getRangeAt(0).getBoundingClientRect()
    : null;

  const viewportH = window.innerHeight;
  const viewportW = window.innerWidth;
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  let top, left;

  if (rect) {
    const spaceBelow = viewportH - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= PANEL_HEIGHT + MARGIN || spaceBelow >= spaceAbove) {
      // Place below selection
      top = rect.bottom + scrollY + MARGIN;
    } else {
      // Place above selection
      top = rect.top + scrollY - PANEL_HEIGHT - MARGIN;
    }

    left = rect.left + scrollX;
  } else {
    top = scrollY + 100;
    left = scrollX + 20;
  }

  // Clamp horizontally so panel never goes off-screen right
  left = Math.min(left, scrollX + viewportW - PANEL_WIDTH - MARGIN);
  left = Math.max(left, scrollX + MARGIN);

  // Clamp vertically — never above the page top
  top = Math.max(top, scrollY + MARGIN);

  return { top, left };
}

function showPanel(result, text, loading) {
  removeExisting();
  const pos = getSelectionPosition();

  const panel = document.createElement("div");
  panel.id = "__ai_detector_panel";

  const snippet = text ? (text.length > 80 ? text.slice(0, 80) + "…" : text) : "";

  panel.innerHTML = `
    <style>
      #__ai_detector_panel {
        position: absolute;
        top: ${pos.top}px;
        left: ${pos.left}px;
        width: 320px;
        z-index: 2147483647;
        font-family: 'Georgia', serif;
        background: #0d0d0d;
        border: 1px solid #2a2a2a;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
        overflow: hidden;
        animation: __aidFadeIn 0.2s ease;
      }
      @keyframes __aidFadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .__aid-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px 10px;
        border-bottom: 1px solid #1e1e1e;
      }
      .__aid-title {
        font-family: 'Georgia', serif;
        font-size: 11px;
        font-weight: normal;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #555;
      }
      .__aid-close {
        background: none;
        border: none;
        color: #444;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
        padding: 0;
        transition: color 0.15s;
      }
      .__aid-close:hover { color: #aaa; }
      .__aid-snippet {
        padding: 10px 14px;
        font-family: sans-serif;
        font-size: 11px;
        color: #3a3a3a;
        border-bottom: 1px solid #1a1a1a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-style: italic;
      }
      .__aid-body { padding: 14px; }
      .__aid-loading {
        text-align: center;
        padding: 20px 0;
        color: #555;
        font-size: 12px;
        font-family: sans-serif;
        letter-spacing: 0.05em;
      }
      .__aid-spinner {
        width: 24px; height: 24px;
        border: 2px solid #222;
        border-top-color: #666;
        border-radius: 50%;
        animation: __aidSpin 0.7s linear infinite;
        margin: 0 auto 10px;
      }
      @keyframes __aidSpin { to { transform: rotate(360deg); } }
      .__aid-score-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        margin-bottom: 10px;
      }
      .__aid-pct {
        font-size: 42px;
        font-weight: normal;
        line-height: 1;
        letter-spacing: -0.02em;
      }
      .__aid-label {
        font-family: sans-serif;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: 4px;
      }
      .__aid-bar-track {
        width: 100%;
        height: 5px;
        background: #1a1a1a;
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 14px;
      }
      .__aid-bar-fill {
        height: 100%;
        border-radius: 10px;
        transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .__aid-signals {
        border-top: 1px solid #1a1a1a;
        padding-top: 10px;
      }
      .__aid-signals-title {
        font-family: sans-serif;
        font-size: 10px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #3a3a3a;
        margin-bottom: 7px;
      }
      .__aid-signal {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 6px;
      }
      .__aid-signal-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        margin-top: 5px;
        flex-shrink: 0;
      }
      .__aid-signal-text {
        font-family: sans-serif;
        font-size: 11px;
        color: #555;
        line-height: 1.4;
      }
      .__aid-signal-text strong {
        font-weight: 600;
        color: #888;
      }
      .__aid-none {
        font-family: sans-serif;
        font-size: 11px;
        color: #333;
        font-style: italic;
      }
    </style>
    <div class="__aid-header">
      <span class="__aid-title">AI Detector</span>
      <button class="__aid-close" id="__aid_close_btn">×</button>
    </div>
    ${snippet ? `<div class="__aid-snippet">"${snippet}"</div>` : ''}
    <div class="__aid-body" id="__aid_body">
      ${loading ? `
        <div class="__aid-loading">
          <div class="__aid-spinner"></div>
          Analyzing…
        </div>
      ` : renderResult(result)}
    </div>
  `;

  document.body.appendChild(panel);

  document.getElementById("__aid_close_btn").addEventListener("click", removeExisting);

  // Animate bar after paint
  if (!loading && result) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fill = document.getElementById("__aid_bar_fill");
        if (fill) fill.style.width = result.score + "%";
      });
    });
  }
}

function renderResult(result) {
  const colors = {
    human:      { pct: "#3a7d44", label: "#3a7d44", bg: "#0d2211", bar: "#3a7d44", dot: "#3a7d44" },
    mixed:      { pct: "#b5860d", label: "#b5860d", bg: "#201800", bar: "#e0a820", dot: "#e0a820" },
    suspicious: { pct: "#c05a1f", label: "#c05a1f", bg: "#1f0e00", bar: "#e07030", dot: "#e07030" },
    ai:         { pct: "#a82020", label: "#a82020", bg: "#1f0000", bar: "#cc2a2a", dot: "#cc2a2a" },
    too_short:  { pct: "#444",    label: "#444",    bg: "#111",    bar: "#333",    dot: "#444" }
  };

  const c = colors[result.verdict] || colors.human;

  const signalsHtml = result.signals.length > 0
    ? result.signals.map(s => `
        <div class="__aid-signal">
          <div class="__aid-signal-dot" style="background:${c.dot}"></div>
          <div class="__aid-signal-text">
            <strong>${s.label}</strong>${s.detail ? ` — ${s.detail}` : ""}
          </div>
        </div>
      `).join("")
    : `<div class="__aid-none">No suspicious patterns found</div>`;

  return `
    <div class="__aid-score-row">
      <span class="__aid-pct" style="color:${c.pct}">${result.score}%</span>
      <span class="__aid-label" style="color:${c.label}; background:${c.bg}">${result.label}</span>
    </div>
    <div class="__aid-bar-track">
      <div class="__aid-bar-fill" id="__aid_bar_fill" style="width:0%; background:${c.bar}"></div>
    </div>
    <div class="__aid-signals">
      <div class="__aid-signals-title">Signals detected</div>
      ${signalsHtml}
    </div>
  `;
}

function showError(msg) {
  removeExisting();
  const pos = getSelectionPosition();
  const panel = document.createElement("div");
  panel.id = "__ai_detector_panel";
  panel.style.cssText = `
    position:absolute; top:${pos.top}px; left:${pos.left}px;
    width:280px; z-index:2147483647; background:#0d0d0d;
    border:1px solid #2a2a2a; border-radius:10px;
    padding:14px; font-family:sans-serif; font-size:12px; color:#a03030;
    box-sizing:border-box;
  `;
  panel.textContent = "Error: " + msg;
  document.body.appendChild(panel);
  setTimeout(removeExisting, 4000);
}

// Close on outside click
document.addEventListener("mousedown", (e) => {
  const panel = document.getElementById("__ai_detector_panel");
  if (panel && !panel.contains(e.target)) removeExisting();
});
