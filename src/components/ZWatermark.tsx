export function ZWatermark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <path
        d="M40 40H160L60 160H160"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
