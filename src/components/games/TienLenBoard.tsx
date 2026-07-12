"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { chooseBotMove } from "@/games/tienlen/bot";
import { canBeat, classifyCombo } from "@/games/tienlen/combos";
import { applyMove, newGame } from "@/games/tienlen/engine";
import { cardFromId } from "@/games/tienlen/deck";
import { pointsForResult } from "@/games/tienlen/scoring";
import {
  RANK_LABELS,
  SUIT_SYMBOLS,
  type Card,
  type TienLenState,
} from "@/games/tienlen/types";
import { useGameStore } from "@/store/gameStore";
import TienLenRules from "./TienLenRules";
import styles from "./games.module.css";

// Swap for "/robo-jayden.png" (or a bitmoji) once a reference picture lands
// in public/ — the placeholder frame renders until then.
const ROBOT_AVATAR_SRC: string | null = null;

function RobotAvatar() {
  if (ROBOT_AVATAR_SRC) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={ROBOT_AVATAR_SRC}
        alt="robo-jayden"
        className={styles.tlAvatarImg}
      />
    );
  }
  return (
    <span className={styles.tlAvatarPlaceholder} title="🤖">
      🤖
    </span>
  );
}

function cardLabel(id: number): string {
  const card = cardFromId(id);
  return `${RANK_LABELS[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

function PlayingCard({
  card,
  selected,
  onClick,
  small,
}: {
  card: Card;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  const red = card.suit >= 2;
  return (
    <button
      className={`${styles.playingCard} ${small ? styles.cardSmall : ""} ${
        selected ? styles.cardSelected : ""
      } ${red ? styles.cardRed : ""}`}
      onClick={onClick}
      disabled={!onClick}
      tabIndex={onClick ? 0 : -1}
    >
      <span>{RANK_LABELS[card.rank]}</span>
      <span className={styles.cardSuit}>{SUIT_SYMBOLS[card.suit]}</span>
    </button>
  );
}

export default function TienLenBoard() {
  const [game, setGame] = useState<TienLenState>(() =>
    newGame(Math.random, 2)
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [awarded, setAwarded] = useState<number | null>(null);
  const [showRules, setShowRules] = useState(false);
  const earn = useGameStore((s) => s.earn);
  const awardedRef = useRef(false);

  const roundDone = game.phase === "roundOver";
  const humanWon = game.finished[0] === 0;
  const botTurn = game.phase === "playing" && game.currentSeat === 1;

  // The bot moves after a beat, until it's the human's turn or the round ends.
  useEffect(() => {
    if (roundDone || game.currentSeat !== 1) return;
    const timer = setTimeout(() => {
      setGame(applyMove(game, chooseBotMove(game, 1)));
    }, 450);
    return () => clearTimeout(timer);
  }, [game, roundDone]);

  // Award points once, when the round ends.
  useEffect(() => {
    if (!roundDone || awardedRef.current) return;
    awardedRef.current = true;
    const raw = pointsForResult(game);
    const botCardsLeft =
      game.finished[0] === 0 ? game.hands[1].length : undefined;
    setAwarded(raw > 0 ? earn("tienlen", raw, botCardsLeft) : 0);
  }, [roundDone, game, earn]);

  const selectedCards = useMemo(
    () => game.hands[0].filter((c) => selected.has(c.id)),
    [game.hands, selected]
  );

  const selectedCombo = useMemo(
    () => (selectedCards.length > 0 ? classifyCombo(selectedCards) : null),
    [selectedCards]
  );

  const isHumanTurn = game.phase === "playing" && game.currentSeat === 0;
  const canPlay =
    isHumanTurn &&
    selectedCombo !== null &&
    (game.topCombo === null
      ? !game.firstMoveOfGame ||
        selectedCombo.cards.some((c) => c.id === game.mustIncludeCardId)
      : canBeat(game.topCombo, selectedCombo));

  const toggleCard = (id: number) => {
    if (!isHumanTurn) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const play = () => {
    if (!canPlay || !selectedCombo) return;
    setGame(applyMove(game, { kind: "play", combo: selectedCombo }));
    setSelected(new Set());
  };

  const pass = () => {
    if (!isHumanTurn || game.topCombo === null) return;
    setGame(applyMove(game, { kind: "pass" }));
    setSelected(new Set());
  };

  const reset = () => {
    setGame(newGame(Math.random, 2));
    setSelected(new Set());
    setAwarded(null);
    awardedRef.current = false;
  };

  const botCards = game.hands[1].length;
  const botMid = (botCards - 1) / 2;
  const hand = game.hands[0];
  const handMid = (hand.length - 1) / 2;
  const fanStep = Math.min(4.5, 55 / Math.max(hand.length, 1));

  // The board stays mounted behind the rules view, so the game (and the
  // bot's pending move) picks up exactly where it left off.
  if (showRules) {
    return (
      <div className={styles.gameWrap}>
        <TienLenRules onBack={() => setShowRules(false)} />
      </div>
    );
  }

  return (
    <div className={styles.gameWrap}>
      <div className={styles.tlScene}>
        {/* the dealer across the table */}
        <div className={styles.tlDealer}>
          <div
            className={`${styles.tlAvatarLarge} ${
              botTurn ? styles.tlAvatarActive : ""
            }`}
          >
            <RobotAvatar />
          </div>
          {botCards > 0 && (
            <div className={styles.tlDealerCards} aria-hidden>
              {Array.from({ length: botCards }, (_, i) => (
                <span
                  key={i}
                  className={styles.tlCardBack}
                  style={{ transform: `rotate(${(i - botMid) * 7}deg)` }}
                />
              ))}
            </div>
          )}
          <span className={`${styles.tlDealerName} mono`}>
            robo-jayden · {botCards} cards
            {game.passed[1] && !roundDone ? " · passed" : ""}
            {botTurn ? " · thinking…" : ""}
          </span>
        </div>

        {/* the felt */}
        <div className={styles.tlFelt}>
          {roundDone ? (
            <div className={styles.tlResult}>
              <p className={styles.pongResult}>
                {humanWon
                  ? `you win! +${awarded} ◆`
                  : "robo-jayden wins — no points this time"}
              </p>
              <button className="btn btn-accent" onClick={reset}>
                deal again
              </button>
            </div>
          ) : game.lastPlay && game.topCombo ? (
            <>
              <span className={`${styles.tlPlayedBy}`}>
                {game.lastPlay.seat === 0 ? "you played" : "robo-jayden played"}
              </span>
              <div className={styles.tlPile}>
                {game.topCombo.cards.map((card) => (
                  <PlayingCard key={card.id} card={card} small />
                ))}
              </div>
            </>
          ) : (
            <span className={styles.tlFeltHint}>
              {isHumanTurn
                ? game.firstMoveOfGame
                  ? `you lead — must include the ${cardLabel(
                      game.mustIncludeCardId
                    )}`
                  : "table is clear — lead anything"
                : "waiting for the lead…"}
            </span>
          )}
          <span className={`${styles.tlFeltText} mono`} aria-hidden>
            · TIẾN LÊN — FIRST OUT PAYS 60◆ PLUS 3◆ A CARD ·
          </span>
        </div>

        {/* your hand, held first-person */}
        {!roundDone && (
          <div className={styles.tlHandFan}>
            {hand.map((card, i) => (
              <span
                key={card.id}
                className={styles.tlFanSlot}
                style={{ transform: `rotate(${(i - handMid) * fanStep}deg)` }}
              >
                <PlayingCard
                  card={card}
                  selected={selected.has(card.id)}
                  onClick={() => toggleCard(card.id)}
                />
              </span>
            ))}
          </div>
        )}
      </div>

      {!roundDone && (
        <div className={styles.statusRow}>
          {/* pass far left, play far right — too easy to misclick side by side */}
          <button
            className="btn"
            onClick={pass}
            disabled={!isHumanTurn || game.topCombo === null}
          >
            pass
          </button>
          <span className={`${styles.tlStatusText} text-dim`}>
            {isHumanTurn
              ? selectedCards.length === 0
                ? "your turn — select cards"
                : selectedCombo
                  ? canPlay
                    ? `${selectedCombo.type} ready`
                    : game.topCombo === null && game.firstMoveOfGame
                      ? `must include the ${cardLabel(game.mustIncludeCardId)}`
                      : "doesn't beat the table"
                  : "not a valid combo"
              : "robo-jayden is thinking…"}
          </span>
          <button
            className="btn btn-accent"
            onClick={play}
            disabled={!canPlay}
          >
            play
          </button>
        </div>
      )}

      <div className={styles.hintRow}>
        <p className={`${styles.gameHint} text-dim`}>
          tiến lên (thirteen), heads-up · singles, pairs, triples, runs · 2s
          are highest · bombs chop 2s · empty your hand first to win
        </p>
        <button
          className={`btn ${styles.tlHelpBtn}`}
          onClick={() => setShowRules(true)}
        >
          how to play
        </button>
      </div>
    </div>
  );
}
