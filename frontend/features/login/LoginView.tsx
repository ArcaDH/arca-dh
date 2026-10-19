import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";

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
    <AuthForm
      title="Welcome back"
      subtitle="Log in to see your budget."
      onSubmit={props.onSubmit}
      footer={
        <>
          No account yet?{" "}
          <Link href="/register" className="font-medium text-link hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          className="h-12"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          value={props.email}
          onChange={(event) => props.onEmailChange(event.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          className="h-12"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          required
          value={props.password}
          onChange={(event) => props.onPasswordChange(event.target.value)}
        />
      </div>

      {props.error && (
        <p role="alert" className="text-sm text-accent">
          {props.error}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={props.isPending} className="mt-2">
        {props.isPending ? "Logging in…" : "Log in"}
      </Button>
    </AuthForm>
  );
}
