import { Car } from "lucide-react";

export default function PrivateAdminDashboard() {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-2">
        <Car className="h-5 w-5" />
        <h1 className="text-xl font-semibold">Private Vehicle Admin</h1>
      </div>

      <p className="mt-2 text-sm text-zinc-400">
        Admin cockpit for private vehicle listings, validations, and operational oversight (to be integrated).
      </p>
    </div>
  );
}
