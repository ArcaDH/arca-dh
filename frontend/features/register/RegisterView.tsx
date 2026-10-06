import Link from "next/link";
import Button from "@/components/ui/button";
import type { RegisterInput } from "@/types/user";

interface RegisterViewProps {
  form: RegisterInput;
  error: string | null;
  isPending: boolean;
  onChange: (field: keyof RegisterInput, value: string) => void;
  onSubmit: () => void;
}

const fields: { name: keyof RegisterInput; label: string; type: string; autoComplete: string }[] = [
  { name: "firstName", label: "First name", type: "text", autoComplete: "given-name" },
  { name: "lastName", label: "Last name", type: "text", autoComplete: "family-name" },
  { name: "username", label: "Username", type: "text", autoComplete: "username" },
  { name: "email", label: "Email", type: "email", autoComplete: "email" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
];

export default function RegisterView(props: RegisterViewProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault(); // stop the browser's own page reload
        props.onSubmit();
      }}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 rounded-xl border border-foreground/10 bg-white p-6 shadow-sm"
    >
      <h1 className="font-heading text-2xl font-bold">Create an account</h1>

      {fields.map((field) => (
        <label key={field.name} className="flex flex-col gap-1.5 text-sm font-medium">
          {field.label}
          <input
            type={field.type}
            autoComplete={field.autoComplete}
            required
            minLength={field.name === "password" ? 8 : undefined}
            value={props.form[field.name]}
            onChange={(event) => props.onChange(field.name, event.target.value)}
            className="rounded-lg border border-foreground/15 px-3 py-2"
          />
        </label>
      ))}

      {props.error && <p className="text-sm text-accent">{props.error}</p>}

      <Button type="submit" isLoading={props.isPending} className="mt-2">
        {props.isPending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-link hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
