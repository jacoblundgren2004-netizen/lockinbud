"use client";

import { useState, useRef } from "react";

/* ===============================
   DIFFICULTY CONFIG
================================ */

const difficultySettings = {
  easy: { base: 650, scale: 30, min: 300 },
  medium: { base: 550, scale: 40, min: 250 },
  hard: { base: 450, scale: 50, min: 200 },
  extreme: { base: 350, scale: 60, min: 150 },
  impossible: { base: 280, scale: 70, min: 100 },
};

type Difficulty = keyof typeof difficultySettings;

/* ===============================
   RANK SYSTEM
================================ */

function getRank(avg: number | null) {
  if (!avg) return "Unranked";
  if (avg < 150) return "Godlike";
  if (avg < 180) return "Pro";
  if (avg < 220) return "Global";
  if (avg < 260) return "Supreme";
  if (avg < 300) return "LEM";
  if (avg < 350) return "DMG";
  if (avg < 450) return "Gold";
  return "Silver";
}

/* ===============================
   COMPONENT
================================ */

export default function AimDuel() {
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");

  const [state, setState] = useState<"idle" | "countdown" | "active" | "result">("idle");
  const [reaction, setReaction] = useState<number | null>(null);

  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const [enemyPosition, setEnemyPosition] = useState<{ x: number; y: number } | null>(null);

  const reactionTimes = useRef<number[]>([]);
  const startTime = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const arenaWidth = 700;
  const arenaHeight = 300;
  const enemySize = 60;

  const config = difficultySettings[difficulty];

  const enemyWindow = Math.max(
    config.base - Math.floor(streak / 3) * config.scale,
    config.min
  );

  /* ===============================
     RESET
  ================================ */

  const resetGame = () => {
    setWins(0);
    setLosses(0);
    setStreak(0);
    setBestStreak(0);
    reactionTimes.current = [];
    setReaction(null);
    setEnemyPosition(null);
    setState("idle");
  };

  /* ===============================
     START ROUND
  ================================ */

  const startRound = () => {
    setState("countdown");
    setReaction(null);
    setEnemyPosition(null);

    setTimeout(() => {
      setState("active");

      const delay = 400 + Math.random() * 1000;

      timeoutRef.current = setTimeout(() => {
        const x = Math.random() * (arenaWidth - enemySize);
        const y = Math.random() * (arenaHeight - enemySize);

        setEnemyPosition({ x, y });
        startTime.current = performance.now();

        timeoutRef.current = setTimeout(() => {
          handleLose();
        }, enemyWindow);
      }, delay);
    }, 800);
  };

  /* ===============================
     SHOOT
  ================================ */

  const shoot = () => {
    if (state !== "active" || !enemyPosition) return;

    const time = Math.floor(performance.now() - startTime.current);
    setReaction(time);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (time <= enemyWindow) {
      handleWin(time);
    } else {
      handleLose();
    }
  };

  const handleWin = (time: number) => {
    reactionTimes.current.push(time);
    setWins((w) => w + 1);

    setStreak((s) => {
      const newStreak = s + 1;
      if (newStreak > bestStreak) setBestStreak(newStreak);
      return newStreak;
    });

    setState("result");
  };

  const handleLose = () => {
    setLosses((l) => l + 1);
    setStreak(0);
    setState("result");
  };

  const avgReaction =
    reactionTimes.current.length > 0
      ? reactionTimes.current.reduce((a, b) => a + b, 0) /
        reactionTimes.current.length
      : null;

  const winRate =
    wins + losses > 0
      ? ((wins / (wins + losses)) * 100).toFixed(1)
      : "0";

  /* ===============================
     UI
  ================================ */

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center p-8">

      <h1 className="text-3xl font-semibold mb-6 tracking-wide">
        CS2 Aim Duel Trainer
      </h1>

      {/* DIFFICULTY */}
      <div className="flex gap-3 mb-6 flex-wrap justify-center">
        {(Object.keys(difficultySettings) as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => {
              setDifficulty(d);
              resetGame();
            }}
            className={`px-4 py-2 rounded-lg border ${
              difficulty === d
                ? "bg-white text-black"
                : "border-zinc-700 hover:bg-zinc-800"
            }`}
          >
            {d.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ARENA */}
      <div
        className="relative"
        style={{ width: arenaWidth, height: arenaHeight }}
      >
        <div
          onClick={shoot}
          className="w-full h-full bg-zinc-900 border border-zinc-800 rounded-xl relative cursor-crosshair"
        >
          {state === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={startRound}
                className="px-6 py-3 bg-white text-black rounded-lg"
              >
                Start Duel
              </button>
            </div>
          )}

          {state === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-400">
              Get Ready...
            </div>
          )}

          {enemyPosition && state === "active" && (
            <div
              onClick={shoot}
              className="absolute bg-red-500 rounded-lg"
              style={{
                width: enemySize,
                height: enemySize,
                left: enemyPosition.x,
                top: enemyPosition.y,
              }}
            />
          )}

          {state === "result" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={startRound}
                className="px-6 py-3 bg-white text-black rounded-lg"
              >
                Next Duel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* RESULT */}
      {reaction !== null && (
        <div className="mt-6 text-lg">
          Reaction: {reaction} ms
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 gap-8 w-[700px] text-sm text-zinc-300 mt-6">

        <div>
          <p>Wins: {wins}</p>
          <p>Losses: {losses}</p>
          <p>Win Rate: {winRate}%</p>
        </div>

        <div>
          <p>Current Streak: {streak}</p>
          <p>Best Streak: {bestStreak}</p>
          <p>Enemy Window: {enemyWindow} ms</p>
        </div>

        <div>
          <p>
            Average Reaction:{" "}
            {avgReaction ? avgReaction.toFixed(0) + " ms" : "-"}
          </p>
        </div>

        <div>
          <p>Rank: {getRank(avgReaction)}</p>
        </div>

      </div>
    </div>
  );
}