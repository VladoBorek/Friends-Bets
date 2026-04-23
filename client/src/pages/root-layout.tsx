import { Outlet } from "@tanstack/react-router";
import { Navbar } from "../components/layout/navbar";

export function RootLayout() {
  return (
    <div className="isolate min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-[90rem] flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <Navbar />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
