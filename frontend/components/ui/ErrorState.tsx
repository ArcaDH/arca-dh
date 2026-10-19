import Button from "@/components/ui/button";

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
        <Button variant="dangerOutline" size="xs" onClick={onRetry} className="shrink-0 py-1">
          Try again
        </Button>
      )}
    </div>
  );
}
