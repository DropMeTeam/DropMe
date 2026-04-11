import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Search, ArrowRightLeft } from "lucide-react";
import PlaceInput from "../PlaceInput";

const defaultValues = {
  from: null,
  to: null,
  date: "",
};

function formatDateOnly(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function formatDisplayDate(dateString) {
  if (!dateString) return "Select travel date";

  const parsed = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return "Select travel date";

  return parsed.toLocaleDateString();
}

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
  const dateInputRef = useRef(null);

  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return formatDateOnly(today);
  }, []);

  const maxDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return formatDateOnly(addDays(today, 7));
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

  function handleDateChange(event) {
    const value = event.target.value;

    if (!value) {
      updateField("date", "");
      return;
    }

    if (value < minDate || value > maxDate) {
      alert("Passenger can select only today up to 1 week from today.");
      updateField("date", "");
      return;
    }

    updateField("date", value);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.from || !form.to || !form.date) {
      alert("Please select From, To, and Date.");
      return;
    }

    if (form.date < minDate || form.date > maxDate) {
      alert("Passenger can select only today up to 1 week from today.");
      return;
    }

    onSearch?.({
      from: form.from,
      to: form.to,
      date: form.date,
    });
  }

  function blockManualDateTyping(event) {
    const allowedKeys = [
      "Tab",
      "Shift",
      "Control",
      "Alt",
      "Meta",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Escape",
      "Enter",
    ];

    if (allowedKeys.includes(event.key)) return;

    event.preventDefault();
  }

  function openDatePicker() {
    if (!dateInputRef.current) return;

    if (typeof dateInputRef.current.showPicker === "function") {
      dateInputRef.current.showPicker();
    } else {
      dateInputRef.current.focus();
      dateInputRef.current.click();
    }
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
        <p className="mt-2 text-xs text-cyan-200/80">
          Allowed travel dates: today up to 7 days only.
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

        <div className="mx-auto max-w-[500px]">
          <label className="mb-2 block text-sm font-medium text-white/70">
            Travel date
          </label>

          <div
            role="button"
            tabIndex={0}
            onClick={openDatePicker}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openDatePicker();
              }
            }}
            className="relative flex h-14 w-full cursor-pointer items-center justify-center rounded-[22px] border border-sky-400/20 bg-black/20 px-5 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.08),0_0_20px_rgba(56,189,248,0.08)] transition-all duration-300 hover:border-sky-300/35 hover:bg-white/[0.05] hover:shadow-[0_0_0_1px_rgba(125,211,252,0.16),0_0_24px_rgba(56,189,248,0.18)]"
          >
            <div className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/50">
              <CalendarDays className="h-5 w-5" />
            </div>

            <div className="pointer-events-none text-center">
              <div className="text-base font-semibold text-white">
                {formatDisplayDate(form.date)}
              </div>
            </div>

            <input
              ref={dateInputRef}
              type="date"
              min={minDate}
              max={maxDate}
              value={form.date}
              onChange={handleDateChange}
              onKeyDown={blockManualDateTyping}
              onPaste={(e) => e.preventDefault()}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
          </div>

          <p className="mt-2 text-center text-xs text-white/45">
            You can choose from {minDate} to {maxDate}.
          </p>
        </div>

        <div className="mx-auto max-w-[500px]">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-300/35 bg-[#dff3ff] px-6 py-3.5 font-semibold text-[#08111f] shadow-[0_0_0_1px_rgba(125,211,252,0.18),0_0_22px_rgba(56,189,248,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-200/60 hover:shadow-[0_0_0_1px_rgba(125,211,252,0.24),0_0_30px_rgba(56,189,248,0.35)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search className="h-4 w-4" />
            {loading ? "Searching..." : "Search buses"}
          </button>
        </div>
      </form>
    </section>
  );
}