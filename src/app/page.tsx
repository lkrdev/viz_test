import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1>Welcome to Viz Render Tests</h1>
      <p>Navigate to /query/[query_id] to view a visualization.</p>
    </main>
  );
}
