export function startLiveLocation({ onUpdate, onError, enableHighAccuracy = true }) {
  if (!("geolocation" in navigator)) {
    onError?.(new Error("Geolocation is not supported on this device/browser."));
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude, accuracy } = pos.coords;
      onUpdate?.({
        lat: latitude,
        lng: longitude,
        accuracyMeters: accuracy,
        timestamp: pos.timestamp,
      });
    },
    (err) => {
      onError?.(err);
    },
    {
      enableHighAccuracy,
      maximumAge: 2000,
      timeout: 15000,
    }
  );

  return watchId;
}

export function stopLiveLocation(watchId) {
  if (watchId == null) return;
  navigator.geolocation.clearWatch(watchId);
}
