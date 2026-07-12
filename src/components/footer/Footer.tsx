import styles from "./footer.module.css";

const EMAIL = "jaydenle@g.ucla.edu";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <span className="text-dim">
          © {new Date().getFullYear()} Jayden Le · all rights reserved
        </span>
        <span className={styles.contact}>
          <a href={`mailto:${EMAIL}`} className={styles.link}>
            {EMAIL}
          </a>
          <span className="text-dim"> · built with two rubber ducks 🦆</span>
        </span>
      </div>
    </footer>
  );
}
