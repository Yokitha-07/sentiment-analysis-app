import { useState } from "react";
import { analyzeSentiment } from "./api";

export default function App() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function onAnalyze() {
    setError("");
    setResult(null);

    const t = text.trim();
    if (!t) {
      setError("Please enter some text.");
      return;
    }

    try {
      setLoading(true);
      const data = await analyzeSentiment(t);
      setResult(data);
    } catch (e) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const badge =
    result?.label === "positive" ? "✅ Positive" :
    result?.label === "negative" ? "❌ Negative" :
    result?.label ? "➖ Neutral" : "";

  return (
    <div style={{ maxWidth: 820, margin: "40px auto", padding: 16, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 6 }}>Sentiment Analysis</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Type text and analyze sentiment using an LLM via FastAPI.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a review, comment, or message..."
        rows={7}
        style={{
          width: "100%",
          padding: 12,
          fontSize: 14,
          borderRadius: 12,
          border: "1px solid #ddd",
          outline: "none",
          resize: "vertical",
        }}
      />

      <div style={{ display: "flex", gap: 12, marginTop: 12, alignItems: "center" }}>
        <button
          onClick={onAnalyze}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ccc",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>

        <button
          onClick={() => { setText(""); setResult(null); setError(""); }}
          disabled={loading}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #ccc",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Clear
        </button>
      </div>

      {error && (
        <div style={{ marginTop: 12, color: "crimson" }}>
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            border: "1px solid #eee",
          }}
        >
          <h3 style={{ marginTop: 0 }}>{badge}</h3>
          <p style={{ margin: "6px 0" }}>
            <b>Confidence:</b> {(result.score * 100).toFixed(1)}%
          </p>

          {Array.isArray(result.reasons) && result.reasons.length > 0 && (
            <>
              <b>Reasons:</b>
              <ul style={{ marginTop: 6 }}>
                {result.reasons.slice(0, 3).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}