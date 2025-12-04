import styles from './LoadingSkeleton.module.css';

export default function LoadingSkeleton() {
  return (
    <div className={styles.container} role="status" aria-label="Loading content">
      <div className={styles.header}>
        <div className={styles.skeletonLine} style={{ width: '60%' }} />
        <div className={styles.skeletonLine} style={{ width: '40%' }} />
      </div>
      <div className={styles.content}>
        <div className={styles.skeletonBox} />
        <div className={styles.skeletonLine} style={{ width: '80%' }} />
        <div className={styles.skeletonLine} style={{ width: '90%' }} />
        <div className={styles.skeletonLine} style={{ width: '70%' }} />
      </div>
      <span className={styles.srOnly}>Loading...</span>
    </div>
  );
}
