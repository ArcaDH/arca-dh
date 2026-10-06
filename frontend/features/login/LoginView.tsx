import Link from "next/link";
import Button from "@/components/ui/button";

interface LoginViewProps {
  email: string;
  password: string;
  error: string | null;
  isPending: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export default function LoginView(props: LoginViewProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        props.onSubmit();
      }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-foreground/10 bg-white p-6 shadow-sm"
    >
      <h1 className="font-heading text-2xl font-bold">Log in</h1>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Email
        <input
          type="email"
          required
          value={props.email}
          onChange={(event) => props.onEmailChange(event.target.value)}
          className="rounded-lg border border-foreground/15 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Password
        <input
          type="password"
          required
          value={props.password}
          onChange={(event) => props.onPasswordChange(event.target.value)}
          className="rounded-lg border border-foreground/15 px-3 py-2"
        />
      </label>

      {props.error && <p className="text-sm text-accent">{props.error}</p>}

      <Button type="submit" isLoading={props.isPending} className="mt-2">
        {props.isPending ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted">
        No account yet?{" "}
        <Link href="/register" className="font-medium text-link hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
