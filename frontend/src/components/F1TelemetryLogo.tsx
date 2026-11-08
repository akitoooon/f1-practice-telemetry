import React from 'react';
import { cx } from './ui/cx';
import styles from './F1TelemetryLogo.module.css';

// Keep the component API for existing desktop consumers; the mark is intentionally static.
export const F1TelemetryLogo: React.FC<{
  size?: number; className?: string; animated?: boolean; variant?: 'icon' | 'badge' | 'monochrome';
}> = ({ size = 28, className, animated = false, variant = 'icon' }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} fill="none" role="img" aria-label="MORE PACE"
    className={cx(styles.logo, className)} data-animated={animated || undefined}>
    {variant === 'badge' && <rect width="64" height="64" rx="8" fill="var(--bg-panel)" />}
    <path d="M10 47V17L25 34L39 17V47M48 17H55V47" stroke={variant === 'monochrome' ? 'currentColor' : 'var(--accent-primary)'} strokeWidth="6" strokeLinejoin="miter" />
  </svg>
);
