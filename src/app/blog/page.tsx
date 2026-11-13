import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getAllPosts } from "@/lib/blog/posts";
import styles from "./blog.module.css";

export const metadata: Metadata = {
  title: "blog · Jayden Le",
  description: "short, random thoughts from jayden",
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.title}>blog</h1>
        <p className="text-dim">short, random thoughts. newest first.</p>
      </header>

      {posts.length === 0 ? (
        <p className="text-dim mono">nothing here yet.</p>
      ) : (
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className={styles.item}>
                <time dateTime={post.date} className={`${styles.date} mono`}>
                  {formatDate(post.date)}
                </time>
                <span className={styles.itemText}>
                  <span className={styles.itemTitle}>{post.title}</span>
                  <span className={styles.itemPreview}>{post.preview}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
