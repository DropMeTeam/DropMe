import PlaceSearch from "./PlaceSearch";

/**
 * PlaceInput (Free Maps Version)
 * Keeps the old API:
 *  - value: { address: string, point: { lat:number, lng:number } }
 *  - onChange: (nextValue) => void
 *  - placeholder: string
 */
export default function PlaceInput({ value, onChange, placeholder, label }) {
  return (
    <PlaceSearch
      label={label || "Location"}
      placeholder={placeholder || "Search location"}
      onSelect={(item) => {
        onChange?.({
          address: item.display,
          point: { lat: item.lat, lng: item.lng },
        });
      }}
    />
  );
}
