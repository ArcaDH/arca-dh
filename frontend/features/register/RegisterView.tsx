import Link from "next/link";
import { AuthForm } from "@/components/auth/AuthForm";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import Label from "@/components/ui/label";
import type { RegisterInput } from "@/types/user";

interface RegisterViewProps {
  form: RegisterInput;
  error: string | null;
  isPending: boolean;
  onChange: (field: keyof RegisterInput, value: string) => void;
  onSubmit: () => void;
}

const fields: {
  name: keyof RegisterInput;
  label: string;
  type: string;
  autoComplete: string;
  placeholder: string;
  half?: boolean;
}[] = [
  { name: "firstName", label: "First name", type: "text", autoComplete: "given-name", placeholder: "Jane", half: true },
  { name: "lastName", label: "Last name", type: "text", autoComplete: "family-name", placeholder: "Doe", half: true },
  { name: "username", label: "Username", type: "text", autoComplete: "username", placeholder: "janedoe" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", placeholder: "name@example.com" },
  { name: "password", label: "Password", type: "password", autoComplete: "new-password", placeholder: "••••••••" },
];

export default function RegisterView(props: RegisterViewProps) {
  return (
    <AuthForm
      title="Create your account"
      subtitle="Start planning your budget in a minute."
      onSubmit={props.onSubmit}
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-link hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        {fields.map((field) => (
          <div key={field.name} className={field.half ? "" : "col-span-2"}>
            <Label htmlFor={`register-${field.name}`}>{field.label}</Label>
            <Input
              id={`register-${field.name}`}
              className="h-12"
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={field.placeholder}
              required
              minLength={field.name === "password" ? 8 : undefined}
              value={props.form[field.name]}
              onChange={(event) => props.onChange(field.name, event.target.value)}
            />
          </div>
        ))}
      </div>

      {props.error && (
        <p role="alert" className="text-sm text-accent">
          {props.error}
        </p>
      )}

      <Button type="submit" size="lg" isLoading={props.isPending} className="mt-2">
        {props.isPending ? "Creating account…" : "Create account"}
      </Button>
    </AuthForm>
  );
}
