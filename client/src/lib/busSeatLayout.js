export const ALLOWED_SEATS_BY_TYPE = {
    Normal: [42, 44, 49, 54],
    "Semi-luxury": [32, 35, 40],
    Luxury: [45, 49, 50],
    Expressway: [32, 35, 40, 45, 49, 50],
  };
  
  const REAR_ROW_SEATS_BY_TYPE = {
    Normal: {
      42: 6,
      44: 6,
      49: 6,
      54: 6,
    },
    "Semi-luxury": {
      32: 6,
      35: 5,
      40: 6,
    },
    Luxury: {
      45: 5,
      49: 5,
      50: 6,
    },
    Expressway: {
      32: 6,
      35: 5,
      40: 6,
      45: 5,
      49: 5,
      50: 6,
    },
  };
  
  export function isValidSeatCount(busType, seatsTotal) {
    const allowed = ALLOWED_SEATS_BY_TYPE[busType] || [];
    return allowed.includes(Number(seatsTotal));
  }
  
  export function getBusLayoutType(busType, seatsTotal) {
    if (busType === "Normal" && [49, 54].includes(Number(seatsTotal))) {
      return "2x3";
    }
  
    return "2x2";
  }
  
  export function getRearRowSeatCount(busType, seatsTotal) {
    return REAR_ROW_SEATS_BY_TYPE?.[busType]?.[Number(seatsTotal)] || 0;
  }
  
  export function getNormalEntranceSeatCount(busType, seatsTotal) {
    if (busType !== "Normal") return 0;
    return getBusLayoutType(busType, seatsTotal) === "2x3" ? 3 : 2;
  }
  
  function getRegularRowCapacity(layoutType) {
    return layoutType === "2x3" ? 5 : 4;
  }
  
  function getRowLabel(index) {
    let current = index;
    let label = "";
  
    do {
      label = String.fromCharCode(65 + (current % 26)) + label;
      current = Math.floor(current / 26) - 1;
    } while (current >= 0);
  
    return label;
  }
  
  function buildSeatLabels(rowLabel, seatCount) {
    return Array.from({ length: seatCount }, (_, index) => `${rowLabel}${index + 1}`);
  }
  
  function splitRegularRow(seatLabels, layoutType) {
    const count = seatLabels.length;
  
    if (layoutType === "2x3") {
      if (count >= 5) {
        return {
          left: seatLabels.slice(0, 2),
          right: seatLabels.slice(2, 5),
        };
      }
  
      if (count === 4) {
        return {
          left: seatLabels.slice(0, 2),
          right: seatLabels.slice(2, 4),
        };
      }
  
      if (count === 3) {
        return {
          left: seatLabels.slice(0, 2),
          right: seatLabels.slice(2, 3),
        };
      }
  
      if (count === 2) {
        return {
          left: seatLabels.slice(0, 2),
          right: [],
        };
      }
  
      return {
        left: seatLabels.slice(0, 1),
        right: [],
      };
    }
  
    if (count >= 4) {
      return {
        left: seatLabels.slice(0, 2),
        right: seatLabels.slice(2, 4),
      };
    }
  
    if (count === 3) {
      return {
        left: seatLabels.slice(0, 2),
        right: seatLabels.slice(2, 3),
      };
    }
  
    if (count === 2) {
      return {
        left: seatLabels.slice(0, 2),
        right: [],
      };
    }
  
    return {
      left: seatLabels.slice(0, 1),
      right: [],
    };
  }
  
  export function buildSeatLayout(busType, seatsTotal) {
    const totalSeats = Number(seatsTotal) || 0;
    const layoutType = getBusLayoutType(busType, totalSeats);
    const allowedOptions = ALLOWED_SEATS_BY_TYPE[busType] || [];
    const rearRowSeats = getRearRowSeatCount(busType, totalSeats);
    const entranceRowSeats = getNormalEntranceSeatCount(busType, totalSeats);
  
    if (!isValidSeatCount(busType, totalSeats)) {
      return {
        busType,
        totalSeats,
        layoutType,
        rearRowSeats,
        entranceRowSeats,
        rows: [],
        allowedOptions,
      };
    }
  
    const regularRowCapacity = getRegularRowCapacity(layoutType);
    let remainingRegularSeats = totalSeats - rearRowSeats - entranceRowSeats;
    let rowIndex = 0;
  
    const rows = [];
  
    while (remainingRegularSeats > 0) {
      const rowLabel = getRowLabel(rowIndex);
      const currentRowSeatCount = Math.min(regularRowCapacity, remainingRegularSeats);
      const seatLabels = buildSeatLabels(rowLabel, currentRowSeatCount);
      const splitRow = splitRegularRow(seatLabels, layoutType);
  
      rows.push({
        rowLabel,
        kind: "split",
        left: splitRow.left,
        right: splitRow.right,
        seatCount: currentRowSeatCount,
      });
  
      remainingRegularSeats -= currentRowSeatCount;
      rowIndex += 1;
    }
  
    if (entranceRowSeats > 0) {
      const rowLabel = getRowLabel(rowIndex);
      const seatLabels = buildSeatLabels(rowLabel, entranceRowSeats);
  
      rows.push({
        rowLabel,
        kind: "entrance",
        entranceLabel: "Entrance",
        seats: seatLabels,
        seatCount: entranceRowSeats,
      });
  
      rowIndex += 1;
    }
  
    if (rearRowSeats > 0) {
      const rowLabel = getRowLabel(rowIndex);
      const rearSeats = buildSeatLabels(rowLabel, rearRowSeats);
  
      rows.push({
        rowLabel,
        kind: "rear",
        seats: rearSeats,
        seatCount: rearRowSeats,
      });
    }
  
    return {
      busType,
      totalSeats,
      layoutType,
      rearRowSeats,
      entranceRowSeats,
      rows,
      allowedOptions,
    };
  }