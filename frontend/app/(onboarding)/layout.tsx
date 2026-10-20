import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.svg";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-white">
      <header className="flex h-16 items-center border-b border-foreground/10 px-5">
        <Link href="/" className="inline-flex">
          <Image src={logo} alt="Arca" width={75} height={32} priority />
        </Link>
      </header>
      <main className="flex flex-1 justify-center px-4 pt-6 md:pt-10">{children}</main>
    </div>
  );
}
