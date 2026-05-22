"use client";

import { useState, FormEvent } from "react";

export default function Home() {
  const [jobTitle, setJobTitle] = useState("Customer Success Manager");
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = jobTitle.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setQuestions([]);

    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setQuestions(data.questions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container">
      <h1>Interview Question Generator</h1>
      <p className="subtitle">
        Enter a job title and get 3 thoughtful interview questions for that role.
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          placeholder="e.g. Customer Success Manager"
          disabled={loading}
          aria-label="Job title"
        />
        <button type="submit" disabled={loading || !jobTitle.trim()}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {loading && (
        <div className="loading">
          <div className="spinner" />
          <span>Generating questions...</span>
        </div>
      )}

      {error && <div className="error">{error}</div>}

      {questions.length > 0 && (
        <section className="questions">
          <h2>Interview questions for {jobTitle}</h2>
          {questions.map((q, i) => (
            <div key={i} className="question">
              <div className="question-number">{i + 1}</div>
              <div className="question-text">{q}</div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
