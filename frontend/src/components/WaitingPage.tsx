"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { partyLeaders, selectRandomLeader, type PartyLeader } from "@/data/party-leaders";

export function WaitingPage() {
  const [leader, setLeader] = useState<PartyLeader | null>(null);
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setLeader(selectRandomLeader());
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
      {/* Ambient background elements */}
      <div className="waiting-bg-grid" />
      <div className="waiting-bg-gradient" />
      <div className="waiting-bg-noise" />

      <main className={`waiting-content ${isVisible ? "waiting-content--visible" : ""}`}>
        {/* Party leader image */}
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

        {/* Text content */}
        <div className="waiting-text">
          <p className="waiting-maybe">Måske</p>
          <h1 className="waiting-name">{leader.leaderName}</h1>
          <p className="waiting-party">
            {leader.partyName} ({leader.partyLetter})
          </p>
        </div>

        {/* Footer */}
        <footer className="waiting-footer">
          <p className="waiting-footer-text">
            Hvem vinder valget? Kommer snart...
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
          background: #0a0e17;
          overflow: hidden;
        }

        .waiting-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
        }

        .waiting-bg-gradient {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 50% 100%, rgba(168, 85, 247, 0.1), transparent);
        }

        .waiting-bg-noise {
          position: absolute;
          inset: 0;
          opacity: 0.4;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          mix-blend-mode: overlay;
          pointer-events: none;
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
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 1.5rem;
          width: 100%;
          max-width: 100vw;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }

        .waiting-content--visible {
          opacity: 1;
          transform: translateY(0);
        }

        .waiting-image-container {
          position: relative;
          width: min(50vh, 90vw, 500px);
          height: min(50vh, 90vw, 500px);
          aspect-ratio: 1 / 1;
          border-radius: 1rem;
          overflow: hidden;
          margin-bottom: 1.5rem;
          box-shadow:
            0 0 0 1px rgba(255, 255, 255, 0.1),
            0 25px 50px -12px rgba(0, 0, 0, 0.5),
            0 0 120px rgba(99, 102, 241, 0.4);
        }

        .waiting-image-glow {
          position: absolute;
          inset: -4px;
          border-radius: 1.25rem;
          background: conic-gradient(
            from 0deg,
            #6366f1,
            #a855f7,
            #ec4899,
            #f43f5e,
            #f97316,
            #eab308,
            #22c55e,
            #14b8a6,
            #0ea5e9,
            #6366f1
          );
          animation: rotate 8s linear infinite;
          opacity: 0.6;
        }

        @keyframes rotate {
          to { transform: rotate(360deg); }
        }

        .waiting-image {
          object-fit: cover !important;
          object-position: center 20% !important;
          filter: grayscale(15%) contrast(1.05);
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
          margin-bottom: 2rem;
        }

        .waiting-maybe {
          font-size: 1.5rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.5);
          letter-spacing: 0.3em;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
          font-family: var(--font-geist-sans), system-ui;
        }

        .waiting-name {
          font-size: clamp(2.5rem, 8vw, 4rem);
          font-weight: 700;
          color: #ffffff;
          line-height: 1.1;
          margin-bottom: 0.75rem;
          text-shadow: 0 2px 20px rgba(99, 102, 241, 0.5);
          font-family: var(--font-geist-sans), system-ui;
        }

        .waiting-party {
          font-size: 1.125rem;
          color: rgba(255, 255, 255, 0.6);
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
          font-size: 0.875rem;
          color: rgba(255, 255, 255, 0.4);
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
          background: #6366f1;
          animation: pulse 1.4s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          40% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @media (max-width: 640px) {
          .waiting-content {
            padding: 1rem;
          }

          .waiting-image-container {
            width: min(45vh, 85vw);
            height: min(45vh, 85vw);
            margin-bottom: 1.25rem;
          }

          .waiting-text {
            margin-bottom: 2rem;
          }

          .waiting-maybe {
            font-size: 1rem;
            margin-bottom: 0.25rem;
          }

          .waiting-name {
            font-size: clamp(1.75rem, 7vw, 2.5rem);
            margin-bottom: 0.5rem;
          }

          .waiting-party {
            font-size: 0.9rem;
          }

          .waiting-footer-text {
            font-size: 0.75rem;
          }
        }

        @media (min-width: 641px) and (min-height: 900px) {
          .waiting-image-container {
            width: min(48vh, 550px);
            height: min(48vh, 550px);
          }
        }
      `}</style>
    </div>
  );
}

