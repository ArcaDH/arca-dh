interface ErrorStateProps {
  message: string;
  /** Shows a "Try again" button. Leave it out for errors where trying again would not help. */
  onRetry?: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="mb-4 flex items-center justify-between gap-4 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent"
    >
      <p>{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 cursor-pointer rounded-full border border-accent px-3 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
        >
          Try again
        </button>
      )}
    </div>
  );
}
