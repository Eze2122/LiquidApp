#!/usr/bin/env bash
# Verificacion ESTRICTA de un AAB antes de subirlo a Google Play.
# Comprueba package name, versionName, versionCode y el fingerprint del
# certificado de carga. Devuelve codigo 0 solo si TODO coincide; de lo
# contrario devuelve 1 (no "pasa" permisivamente).
#
# Uso:  ./scripts/verify-aab.sh ruta/al/archivo.aab
# Requiere: Java (keytool) + bundletool (se descarga si falta).

set -euo pipefail

AAB="${1:?Uso: verify-aab.sh <archivo.aab>}"
[ -f "$AAB" ] || { echo "ERROR: no existe el archivo: $AAB"; exit 1; }

EXPECTED_PKG="com.liquidapp.app"
EXPECTED_VNAME="1.0.2"
EXPECTED_VCODE="106"
EXPECTED_SHA256="F6:A7:36:E4:11:89:E3:90:68:06:58:E1:61:83:49:88:54:69:8A:EE:78:A7:90:09:4E:B9:AA:D3:77:91:E3:21"

BT="bundletool.jar"
if [ ! -f "$BT" ]; then
  echo "Descargando bundletool..."
  curl -sL -o "$BT" \
    https://github.com/google/bundletool/releases/download/1.17.2/bundletool-all-1.17.2.jar
fi

MANIFEST="$(java -jar "$BT" dump manifest --bundle="$AAB")"
PKG="$(printf '%s' "$MANIFEST"   | grep -oE 'package="[^"]+"'              | head -1 | sed -E 's/package="([^"]+)"/\1/')"
VCODE="$(printf '%s' "$MANIFEST" | grep -oE 'android:versionCode="[0-9]+"' | head -1 | sed -E 's/.*"([0-9]+)"/\1/')"
VNAME="$(printf '%s' "$MANIFEST" | grep -oE 'android:versionName="[^"]+"'  | head -1 | sed -E 's/.*versionName="([^"]+)"/\1/')"

SHA256_RAW="$(keytool -printcert -jarfile "$AAB" | grep -iE 'SHA-?256:' | head -1 | sed -E 's/.*SHA-?256:[[:space:]]*//I' | tr -d '[:space:]')"
SHA256_UP="$(printf '%s' "$SHA256_RAW" | tr '[:lower:]' '[:upper:]')"
EXP_SHA_UP="$(printf '%s' "$EXPECTED_SHA256" | tr '[:lower:]' '[:upper:]')"

echo "===== LEIDO ====="
echo "package     = $PKG"
echo "versionName = $VNAME"
echo "versionCode = $VCODE"
echo "SHA-256     = $SHA256_UP"
echo
echo "===== ESPERADO ====="
echo "package     = $EXPECTED_PKG"
echo "versionName = $EXPECTED_VNAME"
echo "versionCode = $EXPECTED_VCODE"
echo "SHA-256     = $EXP_SHA_UP"
echo

fail=0
[ "$PKG"   = "$EXPECTED_PKG" ]   || { echo "FALLA: package no coincide"; fail=1; }
[ "$VNAME" = "$EXPECTED_VNAME" ] || { echo "FALLA: versionName no coincide"; fail=1; }
[ "$VCODE" = "$EXPECTED_VCODE" ] || { echo "FALLA: versionCode no coincide"; fail=1; }
[ -n "$SHA256_UP" ]              || { echo "FALLA: no se pudo leer el SHA-256"; fail=1; }
[ "$SHA256_UP" = "$EXP_SHA_UP" ] || { echo "FALLA: el SHA-256 del certificado NO coincide con la clave de carga"; fail=1; }

if [ "$fail" -ne 0 ]; then
  echo
  echo ">> VERIFICACION FALLIDA. NO subas este AAB a Google Play."
  echo ">> (Si el versionCode 106 estuviera ocupado en Play, subilo en app.json y recompila.)"
  exit 1
fi

echo ">> VERIFICACION OK. El AAB es apto para Google Play."
exit 0
