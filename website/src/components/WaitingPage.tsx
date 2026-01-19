"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { partyLeaders, selectRandomLeader, type PartyLeader } from "@/data/party-leaders";

export function WaitingPage() {
  const [leader, setLeader] = useState<PartyLeader | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const selected = selectRandomLeader();
    setLeader(selected);
    console.log(
      "[waiting-page] Showing holding screen for",
      `${selected.partyName} (${selected.partyLetter})`,
      "led by",
      selected.leaderName,
      "- share:",
      `${selected.percentage.toFixed(1)}%`,
    );
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Don't render until client-side selection is done
  if (!leader) {
    return (
      <div className="waiting-page">
        <div className="waiting-loader" />
      </div>
    );
  }

  return (
    <div className="waiting-page">
      <main className={`waiting-content ${isVisible ? "waiting-content--visible" : ""}`}>
        <header className="waiting-hero">
          <h1 className="waiting-hero-title">Hvem vinder valget?</h1>
          {/* <p className="waiting-hero-subtitle">
            Vi finjusterer prognosemodellen lige nu. Kom tilbage snart for at se de
            første resultater og følg, hvem der står stærkest på valgaftenen.
          </p> */}
        </header>

        <div className="waiting-image-container">
          <div className="waiting-image-glow" />
          {!imageError ? (
            <Image
              src={leader.imageUrl}
              alt={leader.leaderName}
              fill
              className="waiting-image"
              sizes="(max-width: 640px) 85vw, 500px"
              style={{ objectFit: "cover", objectPosition: "center 20%" }}
              priority
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="waiting-image-fallback">
              <span className="waiting-image-fallback-letter">
                {leader.partyLetter}
              </span>
            </div>
          )}
        </div>

        <div className="waiting-text">
          <p className="waiting-maybe">Måske</p>
          <h1 className="waiting-name">{leader.leaderName}</h1>
          <p className="waiting-party">
            {leader.partyName} ({leader.partyLetter})
          </p>
        </div>

        <footer className="waiting-footer">
          <p className="waiting-footer-text">
            Prognosemodellen er under udvikling og vil blive offentliggjort snart...
          </p>
          <div className="waiting-footer-dots">
            <span className="waiting-dot" style={{ animationDelay: "0ms" }} />
            <span className="waiting-dot" style={{ animationDelay: "200ms" }} />
            <span className="waiting-dot" style={{ animationDelay: "400ms" }} />
          </div>
        </footer>
      </main>

      <style jsx>{`
        .waiting-page {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020202;
          overflow: hidden;
          padding: 2rem 1rem;
        }

        .waiting-loader {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(99, 102, 241, 0.3);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .waiting-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 1.25rem;
          padding: 1.5rem;
          width: 100%;
          max-width: 100vw;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        .waiting-hero {
          max-width: 640px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-family: var(--font-geist-sans), system-ui;
        }

        .waiting-hero-tagline {
          text-transform: uppercase;
          letter-spacing: 0.3em;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.35);
        }

        .waiting-hero-title {
          font-size: clamp(2.5rem, 8vw, 3.8rem);
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
        }

        .waiting-hero-subtitle {
          font-size: 1rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.65);
          margin: 0;
        }

        .waiting-content--visible {
          opacity: 1;
          transform: translateY(0);
        }

        .waiting-image-container {
          position: relative;
          width: min(50vh, 90vw, 520px);
          height: min(50vh, 90vw, 520px);
          aspect-ratio: 1 / 1;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 0.75rem;
          box-shadow:
            0 35px 120px rgba(0, 0, 0, 0.8);
        }

        .waiting-image-glow {
          position: absolute;
          inset: -4px;
          border-radius: 28px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.5), transparent 60%);
          filter: blur(60px);
          opacity: 0.8;
          pointer-events: none;
        }

        .waiting-image {
          object-fit: cover !important;
          object-position: center 20% !important;
          filter: contrast(1.05);
        }

        .waiting-image-fallback {
          position: absolute;
          inset: 4px;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .waiting-image-fallback-letter {
          font-size: clamp(6rem, 15vh, 12rem);
          font-weight: 700;
          color: rgba(255, 255, 255, 0.15);
          font-family: var(--font-geist-sans), system-ui;
        }

        .waiting-text {
          margin-bottom: 1.25rem;
        }

        .waiting-maybe {
          font-size: 1.2rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          margin-bottom: 0.25rem;
          font-family: var(--font-geist-sans), system-ui;
        }

        .waiting-name {
          font-size: clamp(2rem, 8vw, 3.5rem);
          font-weight: 700;
          color: #f8fafc;
          line-height: 1.1;
          margin-bottom: 0.5rem;
          font-family: var(--font-geist-sans), system-ui;
        }

        .waiting-party {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.55);
          font-weight: 500;
          font-family: var(--font-geist-sans), system-ui;
        }

        .waiting-footer {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .waiting-footer-text {
          font-size: 0.8rem;
          letter-spacing: 0.06em;
          color: rgba(255, 255, 255, 0.35);
          font-family: var(--font-geist-mono), monospace;
        }

        .waiting-footer-dots {
          display: flex;
          gap: 6px;
        }

        .waiting-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(148, 163, 184, 0.55);
          animation: fade 1.8s ease-in-out infinite;
        }

        @keyframes fade {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.9;
          }
        }

        @media (max-width: 640px) {
          .waiting-content {
            padding: 1rem;
          }

          .waiting-hero {
            gap: 0.4rem;
          }

          .waiting-hero-title {
            font-size: clamp(2rem, 10vw, 2.8rem);
          }

          .waiting-hero-subtitle {
            font-size: 0.95rem;
          }

          .waiting-image-container {
            width: min(45vh, 85vw);
            height: min(45vh, 85vw);
            margin-bottom: 0.5rem;
          }

          .waiting-maybe {
            font-size: 0.95rem;
          }

          .waiting-name {
            font-size: clamp(1.8rem, 8vw, 2.4rem);
          }

          .waiting-party {
            font-size: 0.9rem;
          }

          .waiting-footer-text {
            font-size: 0.7rem;
          }
        }

        @media (min-width: 641px) and (min-height: 900px) {
          .waiting-image-container {
            width: min(48vh, 560px);
            height: min(48vh, 560px);
          }
        }
      `}</style>
    </div>
  );
}

