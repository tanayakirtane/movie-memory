import { signOut } from "@/auth";
import { LogOut } from "lucide-react";
export function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
        type="submit"
      >
        <LogOut size={15} /> Sign out
      </button>
    </form>
  );
}
