import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAllPosts, getPost } from "@/lib/blog/posts";
import styles from "../blog.module.css";

// Every post is prerendered at build time; unknown slugs 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/blog/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} · Jayden Le`,
    description: post.preview,
  };
}

export default async function BlogPost(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className={styles.main}>
      <Link href="/blog" className={`${styles.back} mono`}>
        ← all posts
      </Link>
      <article>
        <header className={styles.postHeader}>
          <h1 className={styles.title}>{post.title}</h1>
          <time dateTime={post.date} className={`${styles.date} mono`}>
            {formatDate(post.date)}
          </time>
        </header>
        {/* html comes from renderMarkdown, which escapes all post text */}
        <div
          className={styles.prose}
          dangerouslySetInnerHTML={{ __html: post.html }}
        />
      </article>
    </main>
  );
}
