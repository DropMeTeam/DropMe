import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Search, ArrowRightLeft } from "lucide-react";
import PlaceInput from "../PlaceInput";

const defaultValues = {
  from: null,
  to: null,
  date: "",
};

export default function BusPassengerSearch({
  onSearch,
  loading = false,
  initialValues = defaultValues,
}) {
  const [form, setForm] = useState({
    ...defaultValues,
    ...initialValues,
  });

  const [fromText, setFromText] = useState(initialValues?.from?.label || "");
  const [toText, setToText] = useState(initialValues?.to?.label || "");

  const minDate = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  useEffect(() => {
    setForm({
      ...defaultValues,
      ...initialValues,
    });
    setFromText(initialValues?.from?.label || "");
    setToText(initialValues?.to?.label || "");
  }, [initialValues]);

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleSwap() {
    setForm((prev) => ({
      ...prev,
      from: prev.to,
      to: prev.from,
    }));

    setFromText(toText);
    setToText(fromText);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.from || !form.to || !form.date) {
      alert("Please select From, To, and Date.");
      return;
    }

    onSearch?.({
      from: form.from,
      to: form.to,
      date: form.date,
    });
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl backdrop-blur-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight text-white">
          Search buses
        </h2>
        <p className="mt-1 text-sm text-white/60">
          Select departure, destination, and travel date to preview the route.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div>
            <PlaceInput
              label="From"
              placeholder="Type departure city or station"
              valueLabel={fromText}
              onValueLabelChange={setFromText}
              onSelect={(place) => {
                setFromText(place.label);
                updateField("from", place);
              }}
            />
          </div>

          <div className="flex items-end justify-center">
            <button
              type="button"
              onClick={handleSwap}
              className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white"
              title="Swap locations"
              aria-label="Swap from and to locations"
            >
              <ArrowRightLeft className="h-5 w-5" />
            </button>
          </div>

          <div>
            <PlaceInput
              label="To"
              placeholder="Type destination city or station"
              valueLabel={toText}
              onValueLabelChange={setToText}
              onSelect={(place) => {
                setToText(place.label);
                updateField("to", place);
              }}
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-white/70">
            Travel date
          </label>
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition focus-within:border-white/30">
            <CalendarDays className="h-5 w-5 text-white/50" />
            <input
              type="date"
              min={minDate}
              value={form.date}
              onChange={(event) => updateField("date", event.target.value)}
              className="w-full bg-transparent text-white outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          {loading ? "Searching..." : "Search buses"}
        </button>
      </form>
    </section>
  );
}