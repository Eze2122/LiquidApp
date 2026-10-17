#!/usr/bin/env bash
# Verifica un AAB antes de subirlo a Google Play.
# Comprueba: package name, versionName, versionCode y el fingerprint del
# certificado de carga. NO afirma nada: muestra los valores reales para comparar.
#
# Uso:  ./scripts/verify-aab.sh ruta/al/archivo.aab
# Requiere: Java (keytool) + bundletool (se descarga si falta).

set -euo pipefail

AAB="${1:?Uso: verify-aab.sh <archivo.aab>}"
[ -f "$AAB" ] || { echo "No existe el archivo: $AAB"; exit 1; }

EXPECTED_PKG="com.liquidapp.app"
EXPECTED_VNAME="1.0.2"
EXPECTED_VCODE="106"
EXPECTED_SHA256="F6:A7:36:E4:11:89:E3:90:68:06:58:E1:61:83:49:88:54:69:8A:EE:78:A7:90:09:4E:B9:AA:D3:77:91:E3:21"
EXPECTED_SHA1="07:C3:C5:87:D3:21:67:28:9C:F8:EB:1F:1E:B2:41:D2:1F:56:6B:02"

BT="bundletool.jar"
if [ ! -f "$BT" ]; then
  echo "Descargando bundletool..."
  curl -sL -o "$BT" \
    https://github.com/google/bundletool/releases/download/1.17.2/bundletool-all-1.17.2.jar
fi

echo "===== MANIFEST ====="
java -jar "$BT" dump manifest --bundle="$AAB" \
  | grep -Eo 'package="[^"]+"|android:versionCode="[0-9]+"|android:versionName="[^"]+"' || true

echo
echo "===== CERTIFICADO DE CARGA ====="
keytool -printcert -jarfile "$AAB" | grep -iE "SHA-?256:|SHA-?1:" || true

echo
echo "===== ESPERADO ====="
echo "package      = $EXPECTED_PKG"
echo "versionName  = $EXPECTED_VNAME"
echo "versionCode  = $EXPECTED_VCODE"
echo "SHA-256      = $EXPECTED_SHA256"
echo "SHA-1        = $EXPECTED_SHA1"
echo
echo ">> Compará manualmente. Si TODO coincide, el AAB es apto para Google Play."
echo ">> Si el versionCode 106 ya estuviera ocupado en Play, subí el valor en app.json y recompilá."
