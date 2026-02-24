import PlaceSearch from "./PlaceSearch";

/**
 * PlaceInput (Safe Mode)
 * Standard return type everywhere:
 * { label, lat, lng }
 */
export default function PlaceInput({
  label,
  placeholder,
  valueLabel,
  onValueLabelChange,
  onSelect,
}) {
  return (
    <PlaceSearch
      label={label}
      placeholder={placeholder}
      value={valueLabel}
      onValueChange={onValueLabelChange}
      onSelect={onSelect}
    />
  );
}
