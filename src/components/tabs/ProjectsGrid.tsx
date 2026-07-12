import { PROJECTS, LANGUAGE_COLORS } from "@/content/projects";
import styles from "./tabs.module.css";

/** GitHub-pinned-repos-style grid. Whole card links to the project. */
export default function ProjectsGrid() {
  return (
    <div className={styles.projectsGrid}>
      {PROJECTS.map((project, i) => {
        const body = (
          <>
            <div className={styles.projectHeader}>
              <svg
                className={styles.projectIcon}
                viewBox="0 0 16 16"
                width="16"
                height="16"
                fill="currentColor"
                aria-hidden
              >
                <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z" />
              </svg>
              <span className={styles.projectName}>{project.name}</span>
              <span className={`${styles.projectChip} mono`}>Public</span>
            </div>
            <p className={styles.projectDesc}>{project.description}</p>
            {project.tags.length > 0 && (
              <div className={`${styles.projectFooter} mono`}>
                {project.tags.map((tag) => (
                  <span key={tag} className={styles.projectTag}>
                    <span
                      className={styles.projectDot}
                      style={{ background: LANGUAGE_COLORS[tag] }}
                      aria-hidden
                    />
                    <span>{tag}</span>
                  </span>
                ))}
              </div>
            )}
          </>
        );

        // Empty slot (no url yet) — a dimmed, non-clickable placeholder.
        if (!project.url) {
          return (
            <div
              key={`${project.name}-${i}`}
              className={`card ${styles.projectCard} ${styles.projectEmpty}`}
            >
              {body}
            </div>
          );
        }

        return (
          <a
            key={`${project.name}-${i}`}
            href={project.url}
            target="_blank"
            rel="noreferrer"
            className={`card ${styles.projectCard}`}
          >
            {body}
          </a>
        );
      })}
    </div>
  );
}
