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
