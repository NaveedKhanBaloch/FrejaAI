import { Header } from "@/components/shared/Header";
import { Sidebar } from "@/components/shared/Sidebar";

export default function OperationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg text-text-1">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Header title="Restaurant operations" />
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
