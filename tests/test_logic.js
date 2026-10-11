// Quick test runner for liquidation logic
const path = require("path");
const Module = require("module");

// Use ts-node-less approach: transpile with esbuild if available, else require ts
try {
  require("ts-node/register/transpile-only");
} catch (e) {
  // fallback: strip types manually from the file we need
}

const { calcularLiquidacion } = require(path.join(__dirname, "../frontend/src/liquidapp/logic.ts"));

function approxEq(a, b) { return Math.abs(a - b) < 0.01; }

function assertCase(name, got, expected) {
  const errors = [];
  for (const k of Object.keys(expected)) {
    if (!approxEq(got[k], expected[k])) {
      errors.push(`  ${k}: got ${got[k]}, expected ${expected[k]}`);
    }
  }
  if (errors.length) {
    console.log(`❌ ${name}`);
    console.log(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log(`✅ ${name}`);
  }
}

// CASO A: Chofer 100%, efectivo 120000
assertCase("CASO A - Chofer 100%", calcularLiquidacion({
  total: 150000, cash: 120000, gnc: 10000, gasolina: 5000,
  porcentajeDueno: 60, fuelMode: "chofer", porcCombustibleDueno: 0,
}), {
  combustible: 15000, tarjeta: 30000, excedentePlataforma: 0,
  parteDueno: 90000, parteChofer: 60000,
  combustibleDueno: 0, combustibleChofer: 15000,
  netoDueno: 90000, gananciaRealChofer: 45000,
  diferencia: 60000, // 120000 - 15000 - 45000
});

// CASO B: Dueño 100%
assertCase("CASO B - Dueño 100%", calcularLiquidacion({
  total: 150000, cash: 120000, gnc: 10000, gasolina: 5000,
  porcentajeDueno: 60, fuelMode: "dueno", porcCombustibleDueno: 0,
}), {
  combustible: 15000, tarjeta: 30000,
  parteDueno: 90000, parteChofer: 60000,
  combustibleDueno: 15000, combustibleChofer: 0,
  netoDueno: 75000, gananciaRealChofer: 60000,
  diferencia: 45000, // 120000 - 15000 - 60000
});

// CASO C: Según porcentaje
assertCase("CASO C - Según porcentaje", calcularLiquidacion({
  total: 150000, cash: 120000, gnc: 10000, gasolina: 5000,
  porcentajeDueno: 60, fuelMode: "porcentaje", porcCombustibleDueno: 0,
}), {
  combustible: 15000, tarjeta: 30000,
  combustibleDueno: 9000, combustibleChofer: 6000,
  netoDueno: 81000, gananciaRealChofer: 54000,
  diferencia: 51000, // 120000 - 15000 - 54000
});

// CASO D: Personalizado 20/80
assertCase("CASO D - Personalizado 20/80", calcularLiquidacion({
  total: 150000, cash: 120000, gnc: 10000, gasolina: 5000,
  porcentajeDueno: 60, fuelMode: "personalizado", porcCombustibleDueno: 20,
}), {
  combustible: 15000, tarjeta: 30000,
  combustibleDueno: 3000, combustibleChofer: 12000,
  netoDueno: 87000, gananciaRealChofer: 48000,
  diferencia: 57000, // 120000 - 15000 - 48000
});

// CASO E: Excedente
assertCase("CASO E - Excedente plataforma", calcularLiquidacion({
  total: 150000, cash: 200000, gnc: 10000, gasolina: 5000,
  porcentajeDueno: 60, fuelMode: "chofer", porcCombustibleDueno: 0,
}), {
  combustible: 15000, tarjeta: 0, excedentePlataforma: 50000,
  parteDueno: 90000, parteChofer: 60000,
  combustibleDueno: 0, combustibleChofer: 15000,
  netoDueno: 90000, gananciaRealChofer: 45000,
  diferencia: 90000, // min(200000,150000)=150000; 150000-15000-45000=90000
});

// Caso: no se deben dinero
// Si chofer tiene exactamente su ganancia real tras combustible
// Ejemplo: total=100, cash=50, chofer 50%, chofer paga 100% combustible 0
//   parteChofer=50, cash=50, combustible=0, gananciaRealChofer=50
//   diferencia = 50 - 0 - 50 = 0
assertCase("Caso balanceado - no se deben dinero", calcularLiquidacion({
  total: 100, cash: 50, gnc: 0, gasolina: 0,
  porcentajeDueno: 50, fuelMode: "chofer", porcCombustibleDueno: 0,
}), {
  tarjeta: 50, diferencia: 0,
});

// Caso: dueño le debe al chofer (chofer recibió poco cash)
// total=100, cash=10, chofer 60% -> parteChofer=60, gananciaRealChofer=60, cash efectivo=10
// diferencia = 10 - 0 - 60 = -50 -> dueño debe darle 50 al chofer
assertCase("Caso dueño debe al chofer", calcularLiquidacion({
  total: 100, cash: 10, gnc: 0, gasolina: 0,
  porcentajeDueno: 40, fuelMode: "chofer", porcCombustibleDueno: 0,
}), {
  tarjeta: 90, diferencia: -50,
});

console.log("Done.");

// ============================================================
// PRUEBAS CONTABLES CRÍTICAS (fase 2 auditoría)
// ============================================================

// PRUEBA A: Excedente de plataforma, reparto 50/50, combustible 50/50
assertCase("PRUEBA A - Excedente plataforma 31000", calcularLiquidacion({
  total: 89000, cash: 120000, gnc: 10000, gasolina: 0,
  porcentajeDueno: 50, fuelMode: "personalizado", porcCombustibleDueno: 50,
}), {
  combustible: 10000, tarjeta: 0, excedentePlataforma: 31000,
  parteDueno: 44500, parteChofer: 44500,
  combustibleDueno: 5000, combustibleChofer: 5000,
  netoDueno: 39500, gananciaRealChofer: 39500,
  // chofer tiene en mano $89k (del reparto) - $10k combustible = $79k;
  // debe quedarse con $39.5k → entrega $39.5k al dueño; excedente $31k va a plataforma
  diferencia: 39500,
});

// PRUEBA B: Efectivo + tarjeta, reparto 50/50, combustible 50/50
assertCase("PRUEBA B - Efectivo + tarjeta -> saldo 17500", calcularLiquidacion({
  total: 120000, cash: 80000, gnc: 5000, gasolina: 0,
  porcentajeDueno: 50, fuelMode: "personalizado", porcCombustibleDueno: 50,
}), {
  combustible: 5000, tarjeta: 40000, excedentePlataforma: 0,
  parteDueno: 60000, parteChofer: 60000,
  combustibleDueno: 2500, combustibleChofer: 2500,
  netoDueno: 57500, gananciaRealChofer: 57500,
  diferencia: 17500, // 80000 - 5000 - 57500 = 17500
});

// 70/30 reparto
assertCase("Reparto 70/30, dueño paga combustible", calcularLiquidacion({
  total: 100000, cash: 70000, gnc: 10000, gasolina: 0,
  porcentajeDueno: 70, fuelMode: "dueno", porcCombustibleDueno: 0,
}), {
  parteDueno: 70000, parteChofer: 30000,
  combustibleDueno: 10000, combustibleChofer: 0,
  netoDueno: 60000, gananciaRealChofer: 30000,
  tarjeta: 30000,
  // chofer efectivo 70000 - combustible 10000 = 60000; su neto es 30000 → entrega 30000
  diferencia: 30000,
});

// Recaudación completamente en tarjeta
assertCase("Todo tarjeta (cash=0)", calcularLiquidacion({
  total: 100000, cash: 0, gnc: 0, gasolina: 0,
  porcentajeDueno: 50, fuelMode: "chofer", porcCombustibleDueno: 0,
}), {
  tarjeta: 100000, parteChofer: 50000, parteDueno: 50000,
  // chofer no tiene efectivo, su neto es 50000 → dueño le debe 50000
  diferencia: -50000,
});

// Todos los importes en cero
assertCase("Caso límite - todos cero (excepto total mínimo)", calcularLiquidacion({
  total: 1, cash: 0, gnc: 0, gasolina: 0,
  porcentajeDueno: 50, fuelMode: "chofer", porcCombustibleDueno: 0,
}), {
  tarjeta: 1, parteChofer: 0.5, diferencia: -0.5,
});

// Cálculo repetido con los mismos datos (idempotencia)
const inp = {
  total: 150000, cash: 120000, gnc: 10000, gasolina: 5000,
  porcentajeDueno: 60, fuelMode: "porcentaje", porcCombustibleDueno: 0,
};
const r1 = calcularLiquidacion(inp);
const r2 = calcularLiquidacion(inp);
if (JSON.stringify(r1) === JSON.stringify(r2)) {
  console.log("✅ Idempotencia - mismo input, mismo output");
} else {
  console.log("❌ Idempotencia rota");
  process.exitCode = 1;
}

console.log("Pruebas contables fase 2: OK.");
