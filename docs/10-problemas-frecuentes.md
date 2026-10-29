# 10 · Problemas frecuentes (todos nos pasaron)

## "Escribí y no contestó"

Síntoma idéntico para causas distintas. Revisar en este orden:

| Causa | Cómo se ve | Arreglo |
|---|---|---|
| Ventana del bot cerrada o compu dormida | Ni los tres puntitos | Reabrir `INICIAR-BOT`; suspensión en "Nunca". |
| **Token temporal vencido** (dura horas) | El mensaje llega a la ventana, pero el envío da **error 190** "Session has expired" | Token permanente del usuario del sistema (doc 6, paso 4). |
| La URL del túnel cambió y Meta apunta a una muerta | No llega nada a la ventana | La plantilla re-registra el webhook al arrancar; si falla, cargarlo a mano. |
| Otro abrió el bot en su compu | Dejó de contestar justo después | Cerrarlo allá; solo el responsable abre `INICIAR-BOT`. |
| Teléfono no autorizado o dígito de país | **Error 131030** "not in allowed list" | Agregarlo en "Para"; el servidor prueba `521`↔`52` y `549`↔`54`. |
| Falta suscribir `messages` | Meta no manda nada | Campos del webhook › `messages` › Suscribirse. |
| Sin método de pago (desde 1-oct-2026) | Deja de entregar al agotar las 1.000 gratis | Tarjeta en el Administrador de WhatsApp › Facturación. |
| **Mensaje interactivo de más de 1.024 caracteres** | "Body text length invalid": la persona no recibe NADA | Texto largo aparte, opciones con una pregunta corta; reenvío numerado si Meta rechaza. |
| Firma inválida | "Mensaje con firma inválida: descartado" | `WHATSAPP_APP_SECRET` mal copiado. |
| Dos apps escuchando el mismo número | Contestan dos bots | Sacar el número de la app/proveedor anterior. |

Diagnóstico rápido: pedirle el número a la Graph API con el token (`GET /{PHONE_NUMBER_ID}`) y
hacer `curl` a la URL del webhook vieja.

## Configuración

- **El `.env` se relee en cada mensaje** (por fecha de modificación): pegar el token nuevo y lo
  toma sin reiniciar. Si un cambio "no se toma", mirar la hora del log: en Logisa el log estaba en
  UTC y parecía que el bot ignoraba el token, cuando había arrancado 9 minutos antes de pegarlo.
  Los logs van en hora local.
- El chequeo de "PEGAR_AQUI" del arrancador no debe matchear los comentarios del archivo.
- Las claves van fuera de Dropbox: si cambia la compu, el `.env` se copia a mano.

## HubSpot

- Rechaza la escritura **entera** si una propiedad no existe → filtrar y avisar.
- Desplegables con etiqueta en vez de valor interno → rechazo.
- Contactos de prueba sobre contactos **reales** (se usó el correo de un director) → solo correos
  ficticios.
- Contacto de prueba con "(borrar)" en la empresa: alguien lo archivó a los 80 s. Usar nombres
  menos obvios y avisar al equipo.
- La Forms API pública da 200 aunque el correo sea inválido: no sirve para probar en seco.

## Motor y texto libre

- Un número pegado a letras ("93PM", "9PX6KG2") no es una capacidad; un número suelto mayor al
  tope del catálogo sin unidad tampoco.
- Una palabra en una lista de "fuera de alcance" puede dejar afuera al cliente ideal ("servidores"
  es la carga, no el producto).
- Sacar una pregunta del flujo hace que lo que ella absorbía caiga en la siguiente (un párrafo
  quedó guardado como ciudad).
- Una frase no es un nombre ("Espera, quiero revisar otra cosa" se guardó como nombre).
- Si el cliente cambia de tema con el formulario abierto ("espera, antes quiero ver…"), soltar el
  formulario y atender lo nuevo.

## Código

- En JavaScript, `"\b"` dentro de un string es un **retroceso**, no un límite de palabra: usar
  `"\\b"` o regex literal.
- No escribir parches con heredocs de bash (`python - <<'PY'`): convierten `\b`, `\s` y `\n` y
  rompen las regex en silencio. Escribir el script en un archivo y correrlo aparte.
- Si hay dos implementaciones de la misma lógica (por ejemplo Python y JS), correr un chequeo de
  paridad antes de publicar. Mejor: **una sola implementación**.
- Servidor estático con caché: agregar `?v=N` a los `.js` o se prueba la versión vieja.

## Trabajo en equipo

- Dos sesiones (o dos personas) editando la misma carpeta el mismo día: avisar y no tocar lo del
  otro. En Logisa la carpeta de Dropbox es compartida con el cliente: "si le toco algo se muere".
- Probadores con una **copia descargada** de la carpeta: sus conversaciones no llegan y no reciben
  cambios. Tienen que **agregar la carpeta compartida a su Dropbox**.
