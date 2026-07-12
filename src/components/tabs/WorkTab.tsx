import ProjectsGrid from "./ProjectsGrid";
import styles from "./tabs.module.css";

export default function WorkTab() {
  return (
    <div>
      <h3 className={styles.subheading}>pinned projects</h3>
      <ProjectsGrid />
    </div>
  );
}
