# AI Post Detector — Firefox Extension

A lightweight Firefox extension that detects whether a LinkedIn or Facebook post was written by AI. Highlight any text, right-click, and get an instant confidence score with the signals that triggered it.

---

## How it works

1. Visit LinkedIn or Facebook
2. **Highlight** any post text
3. Right-click → **"🤖 Detect AI Content"**
4. A panel appears showing:
   - A **0–100% AI confidence score**
   - A verdict: *Likely Human / Possibly AI-Assisted / Probably AI / Very Likely AI*
   - An animated bar
   - The specific **signals** detected (e.g. cliché phrases, emoji density, bullet structure)

No external API. No data sent anywhere. Runs entirely in your browser.

---

## Signals detected

The extension analyses text for patterns common in AI-generated content:

- **AI cliché phrases** — "leverage", "game-changer", "let's dive in", "actionable insights", etc.
- **Uniform sentence length** — low variance in rhythm, a common AI tell
- **Structured bullet lists** — heavy use of numbered or bulleted formatting
- **High emoji density** — overuse of 🚀 💡 ✅ 🎯 etc.
- **Passive / corporate voice** — "has been designed", "can be seen", etc.
- **Hashtag overload** — 4+ hashtags appended to a post
- **Engagement bait phrases** — "drop a comment", "follow for more", "what are your thoughts"

---

## Installation (Firefox)

This extension is not yet on the Firefox Add-ons store. To load it manually:

1. Download or clone this repo
2. Open Firefox and go to `about:debugging`
3. Click **This Firefox** → **Load Temporary Add-on…**
4. Select the `manifest.json` file from this folder

> Note: temporary add-ons are removed when Firefox restarts. For a persistent install, the extension would need to be signed via [addons.mozilla.org](https://addons.mozilla.org).

---

## Files

| File | Purpose |
|------|---------|
| `manifest.json` | Extension config, permissions, metadata |
| `background.js` | Context menu setup + AI scoring logic |
| `content.js` | Floating result panel UI injected into the page |
| `icon.svg` | Toolbar icon |

---

## Limitations

- Heuristic-based — not a trained ML model. It looks for patterns, not meaning.
- Short text (under ~30 words) returns no result — too little signal.
- May produce false positives on very structured human writing.
- Currently works on LinkedIn and Facebook only (can be extended via `manifest.json`).

---

## Roadmap ideas

- [ ] Chrome / Chromium support (manifest already uses WebExtensions API)
- [ ] Expand to Twitter/X and Reddit
- [ ] Per-signal weighting controls in a settings popup
- [ ] ML-based scoring via an optional API

---

## Contributing

PRs welcome. If you spot a common AI phrase pattern that's missing, open an issue or add it to the `aiPhrases` array in `background.js`.

---

## Author

**Guruditya Sinha**
📧 guruditya007@gmail.com
🐙 [github.com/guruditya007](https://github.com/guruditya007)

---

## License

MIT © Guruditya Sinha
