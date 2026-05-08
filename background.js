/**
 * AI Post Detector — Firefox Extension
 * Author: Guruditya Sinha <guruditya007@gmail.com>
 * GitHub: https://github.com/guruditya007/ai-post-detector
 * License: MIT
 */

browser.contextMenus.create({
  id: "analyze-ai",
  title: "🤖 Detect AI Content",
  contexts: ["selection"]
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "analyze-ai") {
    const text = info.selectionText;
    browser.tabs.sendMessage(tab.id, {
      action: "showLoading",
      text: text
    });

    analyzeText(text).then(result => {
      browser.tabs.sendMessage(tab.id, {
        action: "showResult",
        result: result,
        text: text
      });
    }).catch(err => {
      browser.tabs.sendMessage(tab.id, {
        action: "showError",
        error: err.message
      });
    });
  }
});

async function analyzeText(text) {
  if (text.length < 30) {
    return {
      score: 0,
      label: "Too short",
      signals: [],
      verdict: "too_short"
    };
  }

  const signals = [];
  let score = 0;

  // ── Lexical / phrase patterns ──────────────────────────────────────────────

  const aiPhrases = [
    "in today's fast-paced", "in today's digital", "in today's world",
    "it's important to", "it is important to", "it's crucial to",
    "dive deep", "deep dive", "let's explore", "let us explore",
    "game-changer", "game changer", "paradigm shift",
    "transformative", "revolutionize", "revolutionizing",
    "leverage", "leveraging", "synergy", "synergies",
    "at the end of the day", "the bottom line is",
    "thought leadership", "thought leader",
    "in conclusion", "to summarize", "to wrap up",
    "actionable insights", "actionable steps", "key takeaways",
    "unlock your potential", "unlock the power",
    "i'm excited to share", "i'm thrilled to announce",
    "i'm passionate about", "i am passionate about",
    "the future of", "the power of", "the importance of",
    "as we navigate", "navigating the",
    "in this post", "in this article",
    "here are", "here's why", "here is why",
    "don't miss out", "don't sleep on",
    "pro tip:", "quick tip:", "fun fact:",
    "spoiler alert", "food for thought",
    "what are your thoughts", "drop a comment",
    "like and share", "follow for more",
    "✅", "🚀", "💡", "🔥", "👇", "💪", "🎯", "✨", "🌟", "📌",
    "1.", "2.", "3.",  // numbered lists common in AI
    "first,", "second,", "third,", "finally,", "lastly,",
    "not only that,", "what's more,", "furthermore,", "moreover,",
    "it's worth noting", "it is worth noting",
    "a reminder that", "remember that",
    "this is a reminder", "gentle reminder"
  ];

  let phraseHits = 0;
  const foundPhrases = [];
  const lowerText = text.toLowerCase();

  for (const phrase of aiPhrases) {
    if (lowerText.includes(phrase.toLowerCase())) {
      phraseHits++;
      foundPhrases.push(phrase);
    }
  }

  if (phraseHits > 0) {
    const contribution = Math.min(phraseHits * 7, 45);
    score += contribution;
    signals.push({
      label: `${phraseHits} AI cliché phrase${phraseHits > 1 ? "s" : ""}`,
      detail: foundPhrases.slice(0, 3).map(p => `"${p}"`).join(", "),
      weight: contribution
    });
  }

  // ── Emoji density ──────────────────────────────────────────────────────────
  const emojiRegex = /\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu;
  const emojis = text.match(emojiRegex) || [];
  const emojiDensity = emojis.length / (text.split(/\s+/).length);
  if (emojiDensity > 0.05) {
    const contribution = Math.min(Math.round(emojiDensity * 200), 20);
    score += contribution;
    signals.push({ label: "High emoji density", detail: `${emojis.length} emojis`, weight: contribution });
  }

  // ── Sentence structure ─────────────────────────────────────────────────────
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length > 2) {
    const lengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
    if (variance < 12) {
      score += 12;
      signals.push({ label: "Uniform sentence length", detail: "Low variance — robotic rhythm", weight: 12 });
    }
  }

  // ── Paragraph/list structure ───────────────────────────────────────────────
  const lines = text.split(/\n/).filter(l => l.trim().length > 0);
  const bulletLines = lines.filter(l => /^[\-\*•✅✓▶►→]\s/.test(l.trim()) || /^\d+[\.\)]\s/.test(l.trim()));
  if (bulletLines.length >= 3) {
    score += 15;
    signals.push({ label: "Structured bullet list", detail: `${bulletLines.length} list items`, weight: 15 });
  }

  // ── Passive / corporate voice ──────────────────────────────────────────────
  const passivePatterns = [
    /\bis being\b/gi, /\bhas been\b/gi, /\bhave been\b/gi,
    /\bwas designed\b/gi, /\bwere created\b/gi,
    /\bcan be seen\b/gi, /\bmust be\b/gi
  ];
  let passiveCount = 0;
  for (const p of passivePatterns) {
    const m = text.match(p);
    if (m) passiveCount += m.length;
  }
  if (passiveCount >= 2) {
    const contribution = Math.min(passiveCount * 4, 12);
    score += contribution;
    signals.push({ label: "Passive/corporate voice", detail: `${passiveCount} instances`, weight: contribution });
  }

  // ── Hashtag spam ───────────────────────────────────────────────────────────
  const hashtags = (text.match(/#\w+/g) || []).length;
  if (hashtags >= 4) {
    score += 10;
    signals.push({ label: "Hashtag overload", detail: `${hashtags} hashtags`, weight: 10 });
  }

  // ── Caps usage ─────────────────────────────────────────────────────────────
  const words = text.split(/\s+/);
  const capsWords = words.filter(w => w.length > 3 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (capsWords.length >= 2) {
    score += 5;
    signals.push({ label: "Emphasis ALL-CAPS words", detail: capsWords.slice(0, 3).join(", "), weight: 5 });
  }

  // ── Clamp & verdict ───────────────────────────────────────────────────────
  score = Math.min(Math.round(score), 98);

  let verdict, label;
  if (score < 20) { verdict = "human"; label = "Likely Human"; }
  else if (score < 45) { verdict = "mixed"; label = "Possibly AI-Assisted"; }
  else if (score < 70) { verdict = "suspicious"; label = "Probably AI"; }
  else { verdict = "ai"; label = "Very Likely AI"; }

  return { score, label, signals, verdict };
}
