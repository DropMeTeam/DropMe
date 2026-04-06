import StationCard from "./StationCard";

function StationListSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[92px] animate-pulse rounded-2xl border border-white/6 bg-white/[0.03]"
        />
      ))}
    </div>
  );
}

export default function StationListSection({
  stations,
  filteredStations,
  loading,
  activeCount,
  searchTerm,
  onDelete,
}) {
  return (
    <section className="rounded-[24px] border border-white/7 bg-[linear-gradient(180deg,rgba(11,20,33,0.96)_0%,rgba(7,14,25,0.96)_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_20px_40px_rgba(0,0,0,0.2)]">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-semibold text-white">Station Registry</h3>
          <p className="mt-1 text-sm text-white/35">{activeCount} active stations</p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/55">
          Showing {filteredStations.length} of {stations.length}
        </div>
      </div>

      {loading ? (
        <StationListSkeleton />
      ) : filteredStations.length > 0 ? (
        <div className="grid gap-3">
          {filteredStations.map((station) => (
            <StationCard
              key={station._id}
              station={station}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="grid min-h-[140px] place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-center">
          <div>
            <div className="text-sm font-medium text-white/75">
              {searchTerm ? "No matching stations found" : "No stations yet"}
            </div>
            <p className="mt-1 text-xs text-white/35">
              {searchTerm
                ? "Try a different station name or address."
                : "Create your first station from the form above."}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}