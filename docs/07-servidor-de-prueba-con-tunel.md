# 7 · Servidor de prueba en una compu (con túnel de Cloudflare)

Cómo correr el bot en WhatsApp desde la compu del responsable, **sin contratar servidores**. Solo
para la etapa de pruebas, con el número de prueba de Meta.

## Cómo funciona

| Pieza | Qué es |
|---|---|
| Servidor | Programa Node.js que corre mientras la ventana de `INICIAR-BOT.cmd` está abierta. Recibe los mensajes, los pasa al motor y manda la respuesta. |
| Túnel | `cloudflared` da gratis, **sin cuenta**, una dirección `https://<palabras>.trycloudflare.com` que llega a la compu. Es lo que Meta exige (HTTPS). |
| Registro en Meta | La dirección del túnel **cambia en cada arranque**. El servidor la registra sola en Meta al arrancar: no hay que pegarla a mano. |
| Conversaciones | Se guardan igual que en el simulador (Word + texto). |
| HubSpot | `simular` (guarda lo que mandaría) o `real`. |
| IA | Apagada sin llave; activa con `ANTHROPIC_API_KEY`. |
| Secretos | En `%USERPROFILE%\.bot-<cliente>\.env`, **fuera de Dropbox**, para que no se sincronicen ni se compartan. |

## Primera vez

1. Doble clic en `plantilla/INICIAR-BOT.cmd`.
2. Si no existe la configuración, la crea desde `configuracion-ejemplo.txt` y la abre en el Bloc de
   notas. Pegar los datos de Meta (doc 6) donde dice `PEGAR_AQUI`, guardar y volver a abrir.
3. Si falta **Node.js** o **cloudflared**, el `.cmd` los instala solo con `winget` (una vez) y pide
   cerrar y volver a abrir.
4. Esperar ~20 segundos hasta **"LISTO"**. La ventana muestra "Webhook registrado en Meta",
   "HubSpot: REAL/simular" e "IA: activa/apagada".
5. Escribir "Hola" desde un celular autorizado.

## Cada vez que se prueba

- Abrir `INICIAR-BOT.cmd` y esperar "LISTO". **Dejar la ventana abierta** (se puede minimizar).
- Reiniciar una conversación: `/reset` en el WhatsApp.
- Apagar: cerrar la ventana. Con la ventana cerrada o la compu dormida, el bot no contesta.
- Probar sin WhatsApp: `PROBAR-EN-CONSOLA.cmd` (se escribe como cliente en la ventana).
- El simulador (`ABRIR SIMULADOR`) y el bot pueden estar abiertos al mismo tiempo.

## Dejar la compu lista para que todos prueben

- Windows › Configuración › Sistema › Energía › "Poner el dispositivo en suspensión después de":
  **Nunca** (enchufado). La pantalla sí se puede apagar.
- Si la compu se reinicia: volver a abrir `INICIAR-BOT` (y el simulador). En Meta no hay que tocar
  nada: el bot se registra solo.

## Páginas internas del servidor

| Página | Qué muestra |
|---|---|
| `http://localhost:8088/estado` | En línea, conversaciones activas, HubSpot e IA. |
| `http://localhost:8088/costos` | Resumen de mensajes enviados y consultas a la IA. |
| `registros/costos.jsonl` | Detalle: cada respuesta, cada aviso de entrega de Meta (si se cobra y en qué categoría) y los tokens de cada consulta a la IA, **sin el texto** de la conversación. |

Después de una semana de pruebas, `costos.jsonl` es la base para rehacer la estimación de costos
con datos reales.

## Comandos del SDR por WhatsApp (tomar una conversación)

Agregado por Alejandro en Logisa, reutilizable: los teléfonos del SDR van en el `.env`
(`SDR_TELEFONOS=…`) y desde su WhatsApp puede escribirle al número del bot:

- `TOMAR <teléfono>` → el bot deja de contestarle a ese cliente y lo que escribe el cliente le
  llega al SDR.
- `<teléfono>: mensaje` → el SDR le contesta al cliente a través del número del bot.
- `SOLTAR <teléfono>` → el bot retoma donde se quedó.
- `TOMADAS` → lista las conversaciones tomadas.

## Recordatorio y conversación incompleta

A las **2 h** sin respuesta (dentro de la ventana de 24 h de Meta) el bot manda **un** recordatorio.
A las **24 h** pasa al SDR como "conversación incompleta" con lo que alcanzó a decir. Fuera de la
ventana de 24 h desde el último mensaje del cliente, Meta solo deja escribir con **plantillas
aprobadas** (y se cobran aparte).

## Límites de esta etapa

- Contesta solo con la compu encendida, despierta y con la ventana abierta.
- El número de prueba contesta solo a los 5 teléfonos dados de alta.
- El estado de las conversaciones tiene que guardarse en disco (en la plantilla ya está en
  `sesiones/`): si vive solo en memoria, cerrar la ventana corta las conversaciones abiertas.
