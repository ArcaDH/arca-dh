import { SidebarPresenter } from "@/components/sidebar/SidebarPresenter";
import { RequireOnboarding } from "@/features/onboarding/RequireOnboarding";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireOnboarding>
      <div className="flex flex-1 flex-col md:flex-row">
        <SidebarPresenter />
        <main className="min-w-0 flex-1 px-4 py-4 md:px-8 md:py-6">{children}</main>
      </div>
    </RequireOnboarding>
  );
}
