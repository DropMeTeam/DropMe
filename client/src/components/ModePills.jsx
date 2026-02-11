import { cn } from "../lib/utils";
import { BusFront, Users, User } from "lucide-react";

export default function ModePills({ mode, setMode }) {
  const items = [
    { key: "POOL", label: "Pool", icon: Users },
    { key: "PRIVATE", label: "Private", icon: User },
    { key: "TRANSIT", label: "Transit", icon: BusFront }
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(({ key, label, icon: Icon }) => (
        <button
          type="button"
          key={key}
          className={cn("pill", mode === key && "pill-active")}
          onClick={() => setMode(key)}
        >
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}
