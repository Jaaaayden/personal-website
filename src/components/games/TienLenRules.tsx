import styles from "./games.module.css";

/** Beginner-friendly rules panel shown in place of the Tien Len board. */
export default function TienLenRules({ onBack }: { onBack: () => void }) {
  return (
    <div className={styles.tlRules}>
      <h4 className={styles.tlRulesHeading}>the goal</h4>
      <ul className={styles.tlRulesList}>
        <li>
          be the first to play every card in your hand. winning pays 60 ◆ plus
          3 ◆ for each card robo-jayden is still holding.
        </li>
      </ul>

      <h4 className={styles.tlRulesHeading}>card order</h4>
      <ul className={styles.tlRulesList}>
        <li>
          ranks run 3, 4, 5, … 10, J, Q, K, A, 2 — yes,{" "}
          <strong>2 is the highest card</strong>.
        </li>
        <li>
          rank ties break by suit, low to high: ♠ spades, ♣ clubs, ♦ diamonds,
          ♥ hearts. so 3♠ is the lowest card in the deck and 2♥ is the highest.
        </li>
      </ul>

      <h4 className={styles.tlRulesHeading}>what you can play</h4>
      <ul className={styles.tlRulesList}>
        <li>single — any one card</li>
        <li>pair — two cards of the same rank</li>
        <li>triple — three of the same rank</li>
        <li>four of a kind — all four of a rank (also a bomb, see below)</li>
        <li>
          run — 3+ cards of consecutive ranks, like 4-5-6. 2s can never be in a
          run.
        </li>
        <li>
          pair run — 3+ consecutive pairs, like 5-5-6-6-7-7. no 2s here either.
        </li>
      </ul>

      <h4 className={styles.tlRulesHeading}>how a trick works</h4>
      <ul className={styles.tlRulesList}>
        <li>
          whoever holds the lowest dealt card leads the very first trick, and
          that first play must include it.
        </li>
        <li>
          to beat the table you must play the <strong>same combo type and
          size</strong> with a higher top card — a pair only beats a pair, a
          5-card run only beats a 5-card run. suit breaks rank ties.
        </li>
        <li>
          can&rsquo;t (or don&rsquo;t want to) beat it? pass — but passing
          locks you out for the rest of that trick. once everyone else passes,
          the table clears and the last player to play leads anything they
          like.
        </li>
        <li>you can&rsquo;t pass when you&rsquo;re the one leading.</li>
      </ul>

      <h4 className={styles.tlRulesHeading}>bombs (chops)</h4>
      <ul className={styles.tlRulesList}>
        <li>
          the one exception to matching the combo type — and your answer to 2s:
        </li>
        <li>a 3-pair run chops a single 2</li>
        <li>four of a kind chops a single 2 or a pair of 2s</li>
        <li>a pair run of 4+ chops any of those</li>
        <li>
          bombs also beat weaker bombs: 3-pair run &lt; four of a kind &lt;
          4+-pair run
        </li>
      </ul>

      <div className={styles.tlRulesFooter}>
        <button className="btn btn-accent" onClick={onBack}>
          back to game
        </button>
      </div>
    </div>
  );
}
