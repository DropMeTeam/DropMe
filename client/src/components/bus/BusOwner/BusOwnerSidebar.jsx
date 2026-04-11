import {
    LayoutDashboard,
    BusFront,
    PlusCircle,
    CalendarDays,
    User,
  } from "lucide-react";
  
  const menuItems = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "mybuses", label: "My Fleet", icon: BusFront },
    { key: "add", label: "Add Bus", icon: PlusCircle },
    { key: "schedules", label: "Schedules", icon: CalendarDays },
    { key: "profile", label: "Profile", icon: User },
  ];
  
  export default function BusOwnerSidebar({ activeTab, onChangeTab }) {
    return (
      <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-white/10 bg-[#05070b] text-white">
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/20">
              <BusFront className="h-5 w-5 text-emerald-400" />
            </div>
  
            <div>
              <h2 className="text-sm font-semibold tracking-wide text-white">
                Bus Owner
              </h2>
              <p className="text-xs text-zinc-400">Fleet Management Hub</p>
            </div>
          </div>
        </div>
  
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
  
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChangeTab(item.key)}
                  className={[
                    "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-zinc-900 text-emerald-400 shadow-[0_0_0_1px_rgba(16,185,129,0.12)]"
                      : "text-zinc-400 hover:bg-zinc-900/80 hover:text-white",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </aside>
    );
  }