// Business logic for LiquidApp. Pure functions. No React, no storage.

export type FuelMode = "chofer" | "dueno" | "porcentaje" | "personalizado";

export interface CalcInput {
  total: number;
  cash: number;
  gnc: number;
  gasolina: number;
  porcentajeDueno: number;
  fuelMode: FuelMode;
  porcCombustibleDueno: number; // used only when fuelMode === "personalizado"
}

export interface CalcResult {
  total: number;
  cash: number;
  gnc: number;
  gasolina: number;
  combustible: number;

  tarjeta: number;
  excedentePlataforma: number;

  porcentajeDueno: number;
  porcentajeChofer: number;

  parteDueno: number; // bruta
  parteChofer: number; // bruta

  fuelMode: FuelMode;
  porcCombustibleDueno: number;
  porcCombustibleChofer: number;
  combustibleDueno: number;
  combustibleChofer: number;

  netoDueno: number; // parteDueno - combustibleDueno
  gananciaRealChofer: number; // parteChofer - combustibleChofer

  // Positive  -> chofer debe darle al dueño (diferencia)
  // Negative  -> dueño  debe darle al chofer (|diferencia|)
  // Zero      -> no se deben
  diferencia: number;
}

export function calcularLiquidacion(i: CalcInput): CalcResult {
  const combustible = (i.gnc || 0) + (i.gasolina || 0);

  const porcentajeDueno = clampPct(i.porcentajeDueno);
  const porcentajeChofer = 100 - porcentajeDueno;

  // Percentages ALWAYS applied over the total collection, never after
  // subtracting fuel.
  const parteDueno = i.total * (porcentajeDueno / 100);
  const parteChofer = i.total * (porcentajeChofer / 100);

  // Cash vs card vs platform surplus.
  let tarjeta = 0;
  let excedentePlataforma = 0;
  if (i.cash <= i.total) {
    tarjeta = i.total - i.cash;
  } else {
    excedentePlataforma = i.cash - i.total;
  }

  // Fuel split based on selected modality.
  let porcCombustibleDueno = 0;
  switch (i.fuelMode) {
    case "chofer":
      porcCombustibleDueno = 0;
      break;
    case "dueno":
      porcCombustibleDueno = 100;
      break;
    case "porcentaje":
      porcCombustibleDueno = porcentajeDueno;
      break;
    case "personalizado":
      porcCombustibleDueno = clampPct(i.porcCombustibleDueno);
      break;
  }
  const porcCombustibleChofer = 100 - porcCombustibleDueno;
  const combustibleDueno = combustible * (porcCombustibleDueno / 100);
  const combustibleChofer = combustible * (porcCombustibleChofer / 100);

  const netoDueno = parteDueno - combustibleDueno;
  const gananciaRealChofer = parteChofer - combustibleChofer;

  // Settlement:
  // Cash the driver physically holds (excluding platform surplus).
  // Assumes the driver paid the whole fuel bill out of that cash.
  const efectivoBase = Math.min(i.cash, i.total);
  const efectivoChoferTrasCombustible = efectivoBase - combustible;
  const diferencia = efectivoChoferTrasCombustible - gananciaRealChofer;

  return {
    total: i.total,
    cash: i.cash,
    gnc: i.gnc || 0,
    gasolina: i.gasolina || 0,
    combustible,
    tarjeta,
    excedentePlataforma,
    porcentajeDueno,
    porcentajeChofer,
    parteDueno,
    parteChofer,
    fuelMode: i.fuelMode,
    porcCombustibleDueno,
    porcCombustibleChofer,
    combustibleDueno,
    combustibleChofer,
    netoDueno,
    gananciaRealChofer,
    diferencia,
  };
}

function clampPct(v: number): number {
  if (isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

export function formatMoney(n: number): string {
  const rounded = Math.round(n);
  return "$ " + rounded.toLocaleString("es-AR");
}
