# LiquidApp — PRD

Aplicación móvil (Expo React Native) para liquidaciones entre un **chofer** y un **dueño** de un vehículo. Reemplazo nativo del proyecto Capacitor existente, manteniendo nombre `LiquidApp`, package `com.liquidapp.app`, icono original y estética (fondo gris claro #f2f4f7, tarjetas blancas, botón primario negro).

## Pantallas
- `/` (index): formulario de liquidación + resultado detallado.
- `/history`: historial local (AsyncStorage), con copiar/eliminar/borrar todo.

## Lógica de cálculo (src/liquidapp/logic.ts)
Porcentajes se aplican sobre la **recaudación total** antes de cualquier descuento de combustible.
- `parteDueno = total × %dueño`
- `parteChofer = total × (100 − %dueño)`

Combustible = GNC + Nafta. 4 modalidades:
1. **Chofer 100%** → combustibleDueño = 0
2. **Dueño 100%** → combustibleChofer = 0
3. **Según porcentaje de la recaudación** → usa automáticamente los mismos % de reparto
4. **Personalizado** → `%combustibleDueño` ingresado; chofer = 100 − dueño

Resultados:
- `netoDueno = parteDueno − combustibleDueno`
- `gananciaRealChofer = parteChofer − combustibleChofer`

Efectivo / tarjeta / excedente:
- Si `cash ≤ total`: tarjeta = `total − cash` (queda en cuenta del dueño).
- Si `cash > total`: excedente = `cash − total` (plataforma, NO se mezcla con el reparto).

Liquidación chofer↔dueño (asume que el chofer pagó físicamente todo el combustible):
- `efectivoBase = min(cash, total)` (excluye excedente de plataforma)
- `diferencia = efectivoBase − combustible − gananciaRealChofer`
- `> 0`: chofer entrega a dueño; `< 0`: dueño entrega a chofer; `= 0`: no se deben.

## Historial (AsyncStorage, key `liquidapp_historial`)
Guarda todos los campos: fecha, tipo, nombres, recaudación, efectivo, tarjeta, excedente, %dueño/chofer, GNC, nafta, combustible total, modalidad combustible, %combustible dueño/chofer, montos, parte bruta, neto dueño, ganancia real chofer, diferencia.
Compatibilidad con registros antiguos: campos opcionales se muestran con fallback cuando no existen.

## Pruebas obligatorias — todas verificadas ✅
Casos A, B, C, D y E (incluido excedente $50.000 que no se mezcla).

## Identidad preservada
- Nombre: **LiquidApp**
- `android.package` / `ios.bundleIdentifier`: `com.liquidapp.app`
- Icono y adaptive icon extraídos del APK original.
- Sin logos / imágenes / splash Emergent.
