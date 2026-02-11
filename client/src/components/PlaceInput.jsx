import { Autocomplete } from "@react-google-maps/api";
import { useRef } from "react";

export default function PlaceInput({ value, onChange, placeholder }) {
  const acRef = useRef(null);

  return (
    <Autocomplete
      onLoad={(ac) => (acRef.current = ac)}
      onPlaceChanged={() => {
        const place = acRef.current?.getPlace();
        if (!place?.geometry?.location) return;
        onChange({
          address: place.formatted_address || place.name || "",
          point: { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() }
        });
      }}
    >
      <input
        className="input"
        value={value?.address || ""}
        placeholder={placeholder}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
      />
    </Autocomplete>
  );
}
