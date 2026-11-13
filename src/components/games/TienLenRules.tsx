import styles from "./games.module.css";

/** Short rules panel shown in place of the Tien Len board. */
export default function TienLenRules({ onBack }: { onBack: () => void }) {
  return (
    <div className={styles.tlRules}>
      <h4 className={styles.tlRulesHeading}>goal</h4>
      <ul className={styles.tlRulesList}>
        <li>empty your hand first. win = 60 ◆ + 3 ◆ per card robo-jayden holds.</li>
      </ul>

      <h4 className={styles.tlRulesHeading}>card order</h4>
      <ul className={styles.tlRulesList}>
        <li>
          3 → 10 → J Q K A → <strong>2 (highest)</strong>
        </li>
        <li>ties break by suit: ♠ &lt; ♣ &lt; ♦ &lt; ♥ (3♠ lowest, 2♥ highest)</li>
      </ul>

      <h4 className={styles.tlRulesHeading}>combos</h4>
      <ul className={styles.tlRulesList}>
        <li>single, pair, triple, four of a kind</li>
        <li>run: 3+ in a row, e.g. 4-5-6</li>
        <li>pair run: 3+ pairs in a row, e.g. 55-66-77</li>
        <li>no 2s in runs</li>
      </ul>

      <h4 className={styles.tlRulesHeading}>turns</h4>
      <ul className={styles.tlRulesList}>
        <li>first play must include the lowest card dealt.</li>
        <li>
          beat the table with the <strong>same combo, same size, higher top
          card</strong>: pair beats pair, 5-run beats 5-run.
        </li>
        <li>
          pass = you&rsquo;re out until the table clears. last player standing
          leads anything.
        </li>
      </ul>

      <h4 className={styles.tlRulesHeading}>bombs (beat 2s)</h4>
      <ul className={styles.tlRulesList}>
        <li>3-pair run → beats a single 2</li>
        <li>four of a kind → beats a 2, a pair of 2s, or a 3-pair run</li>
        <li>4+ pair run → beats all of the above</li>
      </ul>

      <div className={styles.tlRulesFooter}>
        <button className="btn btn-accent" onClick={onBack}>
          back to game
        </button>
      </div>
    </div>
  );
}
