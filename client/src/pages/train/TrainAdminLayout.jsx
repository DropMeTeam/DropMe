import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  TrainFront,
  MapPinned,
  CalendarPlus2,
  CalendarCog,
  TicketCheck,
} from "lucide-react";

const EXPANDED_WIDTH = 240;
const COLLAPSED_WIDTH = 84;

const navItems = [
  { label: "Stations", to: "/train/stations", icon: MapPinned },
  { label: "Create Schedule", to: "/train/schedules", icon: CalendarPlus2 },
  { label: "Manage Schedules", to: "/train/timetables", icon: CalendarCog },
  { label: "Verify Ticket", to: "/train/ticket-verify", icon: TicketCheck },
];

function SidebarNavItem({ item, collapsed, onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname === item.to;
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => {
        navigate(item.to);
        onNavigate?.();
      }}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? item.label : undefined}
      className={[
        "group relative flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left text-sm font-medium transition-all duration-200",
        isActive
          ? "border-blue-300/20 bg-blue-500/15 text-blue-100 shadow-[inset_0_0_0_1px_rgba(96,165,250,0.35),0_8px_24px_rgba(29,78,216,0.18)]"
          : "border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05] hover:text-white",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span
        className={[
          "truncate transition-all duration-200",
          collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100",
        ].join(" ")}
      >
        {item.label}
      </span>
    </button>
  );
}

function SidebarContent({ collapsed, onCollapseToggle, onNavigate }) {
  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,rgba(10,17,29,0.98)_0%,rgba(6,12,22,0.99)_100%)]">
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
        <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
          <TrainFront className="h-5 w-5 text-blue-200" />
        </div>

        <div className={collapsed ? "hidden" : "min-w-0"}>
          <p className="truncate text-sm font-semibold text-white">Train Admin</p>
          <p className="truncate text-xs text-white/45">Railway control center</p>
        </div>

        <button
          type="button"
          onClick={onCollapseToggle}
          className="ml-auto hidden h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white lg:inline-flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-3">
        {navItems.map((item) => (
          <SidebarNavItem
            key={item.to}
            item={item}
            collapsed={collapsed}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

export default function TrainAdminLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarWidth = useMemo(
    () => (collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH),
    [collapsed]
  );

  return (
    <div className="-mx-3 -my-4 overflow-x-clip md:-mx-4 xl:-mx-5">
      <div className="relative min-h-[calc(100vh-68px)] bg-[radial-gradient(1200px_700px_at_0%_0%,rgba(30,64,175,0.08),transparent_55%),#040914]">
        <aside
          className="fixed bottom-0 left-0 top-[61px] z-30 hidden border-r border-white/10 shadow-[18px_0_40px_rgba(0,0,0,0.35)] lg:block"
          style={{ width: `${sidebarWidth}px` }}
        >
          <SidebarContent
            collapsed={collapsed}
            onCollapseToggle={() => setCollapsed((prev) => !prev)}
          />
        </aside>

        <div className="sticky top-[61px] z-20 border-b border-white/10 bg-[#08111e]/90 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <TrainFront className="h-4 w-4 text-blue-200" />
              <p className="text-sm font-semibold">Train Admin</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/80 transition hover:bg-white/[0.08]"
              aria-label="Open train admin menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="fixed inset-0 z-40 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"
              onClick={() => setMobileOpen(false)}
              aria-label="Close train admin menu"
            />
            <aside className="absolute bottom-0 left-0 top-0 w-[86%] max-w-[300px] border-r border-white/10 shadow-[24px_0_50px_rgba(0,0,0,0.45)]">
              <SidebarContent
                collapsed={false}
                onCollapseToggle={() => {}}
                onNavigate={() => setMobileOpen(false)}
              />
            </aside>
          </div>
        ) : null}

        <section
          className="min-w-0 pl-0 transition-[padding] duration-300 lg:pr-4 lg:pl-[var(--sidebar-offset)]"
          style={{ "--sidebar-offset": `${sidebarWidth + 16}px` }}
        >
          <div className="mx-auto min-w-0 max-w-[1700px] px-2 py-4 md:px-4 md:py-5">
            <div key={location.pathname} className="min-w-0">
              <Outlet />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
