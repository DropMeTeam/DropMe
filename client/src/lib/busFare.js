const FARE_RULES = {
    Normal: {
      baseFare: 35,
      perKm: 3.0,
      minFare: 35,
    },
    "Semi-luxury": {
      baseFare: 45,
      perKm: 3.75,
      minFare: 45,
    },
    Luxury: {
      baseFare: 60,
      perKm: 4.5,
      minFare: 60,
    },
    Expressway: {
      baseFare: 80,
      perKm: 5.75,
      minFare: 80,
    },
  };
  
  function roundUpToNearest(value, step = 5) {
    return Math.ceil(value / step) * step;
  }
  
  export function calculateBusFare({ busType, distanceKm }) {
    const safeDistanceKm = Math.max(Number(distanceKm) || 0, 0);
    const selectedRule = FARE_RULES[busType] || FARE_RULES.Normal;
  
    const rawFare = selectedRule.baseFare + safeDistanceKm * selectedRule.perKm;
    const fareLkr = Math.max(
      selectedRule.minFare,
      roundUpToNearest(rawFare, 5)
    );
  
    return {
      fareLkr,
      distanceKm: Number(safeDistanceKm.toFixed(1)),
      rule: selectedRule,
    };
  }
  
  export function formatLkr(amount) {
    const safeAmount = Number(amount) || 0;
    return `LKR ${safeAmount.toLocaleString()}`;
  }
  
  export { FARE_RULES };