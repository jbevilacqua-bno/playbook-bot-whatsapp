# Plantilla · bot de WhatsApp (Node.js, sin dependencias)

Punto de partida para cada bot nuevo. Reúne en poco código lo que en Logisa quedó repartido en
miles de líneas: motor determinista, intérprete con IA opcional, servidor de WhatsApp con túnel y
registro automático del webhook, simulador con pantalla de celular, HubSpot y arrancadores de doble
clic. Probado el 29-oct-2026 con `probar.js` (28 casos), el webhook local (verificación, firma,
duplicados) y el simulador en el navegador. **No se probó contra Meta, HubSpot ni Claude reales**:
eso se hace con las cuentas del cliente siguiendo los docs 4 a 7.

## Archivos

| Archivo | Qué es | ¿Se edita por cliente? |
|---|---|---|
| `motor.js` | Toda la lógica: servicios, preguntas, bases autorizadas, textos, cosecha de datos, regla B, BANT 0–5 y cierres. | **Sí: el bloque `CONFIG`** (y las expresiones de `extraer()` con el vocabulario del cliente) |
| `ia.js` | Intérprete con Claude: mensaje → ficha JSON cerrada. 15 s, 2 reintentos, respaldo con reglas. | Las frases de `texto_claro` si cambian las del motor |
| `hubspot.js` | Crea/actualiza el contacto por correo, sin pisar datos existentes, y mantiene una nota por conversación. Modo `simular` o `real`. | **Sí: `PROPIEDADES`** con los nombres internos del portal |
| `servidor.js` | Webhook de Meta (verificación + firma HMAC + duplicados), envío con límites de Meta y reintento numerado, `521/549`, sesiones en disco, recordatorio 2 h / incompleta 24 h, `/estado`, `/costos`, simulador y túnel. | No |
| `simulador.html` | Pantalla de celular + ficha para el SDR. | Opcional (marca) |
| `configuracion-ejemplo.txt` | Plantilla del `.env`. | Nombre de la carpeta |
| `INICIAR-BOT.cmd` | WhatsApp de prueba: crea el `.env`, instala Node y cloudflared si faltan, abre el túnel y registra el webhook. | No |
| `ABRIR-SIMULADOR.cmd` | Simulador en `http://localhost:8090/simulador` y liga con llave para probadores. | No |
| `PROBAR-EN-CONSOLA.cmd` | Conversación por la ventana, sin red. | No |
| `probar.js` | Banco de pruebas sin red. Sumar cada error encontrado con su mensaje exacto. | **Sí** |

## Arranque rápido

```bash
node probar.js
```

```bash
node servidor.js --consola
```

En Windows, doble clic en `ABRIR-SIMULADOR.cmd` (simulador) o `INICIAR-BOT.cmd` (WhatsApp de prueba).

## Para un cliente nuevo

1. Copiar la carpeta y cambiar `.bot-cliente` por `.bot-<cliente>` en `servidor.js` y en los `.cmd`
   (así dos bots en la misma compu no comparten claves).
2. Llenar `CONFIG` en `motor.js` con lo del cuestionario de arranque (doc 1).
3. Adaptar `probar.js` y correrlo hasta que quede en verde.
4. Simulador con el equipo del cliente → HubSpot → IA → Meta (docs 3 a 7).

## Qué tiene el bot de Logisa que esta plantilla no trae

Guardado en Word con la ficha (acá es `.txt`), comandos TOMAR/SOLTAR para el SDR, adjuntos y notas
de voz, varios servicios con calificación por servicio, índice TF-IDF sobre las bases, juez IA y
exámenes. Están descritos en los docs; se agregan cuando el cliente los necesite.
