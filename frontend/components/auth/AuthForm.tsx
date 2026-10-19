import type { FC, ReactNode, SubmitEvent } from "react";

interface AuthFormProps {
  title: string;
  subtitle: string;
  footer: ReactNode;
  onSubmit: () => void;
  children: ReactNode;
}

export const AuthForm: FC<AuthFormProps> = ({ title, subtitle, footer, onSubmit, children }) => {
  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); // stop the browser's own page reload
    onSubmit();
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        {children}
      </form>
      <p className="mt-6 text-center text-sm text-muted">{footer}</p>
    </div>
  );
};
