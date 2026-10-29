# 8 · Pasar a producción

> **Estado en Logisa al 29-oct-2026:** el bot está liberado en pruebas (número de prueba, HubSpot
> real, IA real) y el paso a producción está **diseñado y presupuestado pero no ejecutado**. Lo que
> sigue es el camino definido con Alejandro (checklist del 1-oct y "Paso a producción F2" del
> 22-oct) más los pasos estándar de Meta para el número definitivo. Al ejecutarlo en el primer
> cliente, corregir este documento con lo que se vea en pantalla.

## La puerta: liberación del ambiente de pruebas

No se monta producción hasta que:
- El ambiente de pruebas reproduce producción: **CRM real, IA real, mismas reglas**.
- Pasó una corrida completa con IA sin errores graves (los graves cambian la calificación, el
  servicio o lo que llega al CRM; los menores de redacción no frenan, se juntan y se corrigen cada
  semana).
- Los comentarios de los probadores están revisados y cerrados.
- **Firma del dueño del proyecto** con fecha, respaldo del código y versión del control.

## Fase 1 · Aprobaciones del cliente

| # | Paso | Detalle |
|---|---|---|
| 1 | Presupuesto aprobado | Con la tabla de [costos](09-costos.md). |
| 2 | Proveedor del servidor | AWS México (recomendado en Logisa), Azure México o Railway Pro. |
| 3 | Modelo de IA | Sonnet 5.5 (recomendado) u Opus 5.5. |
| 4 | Número de WhatsApp | Liberar el que usaba el proveedor anterior o dar de alta uno nuevo. |
| 5 | **Método de pago en la cuenta de WhatsApp** | Urgente: sin él, Meta no entrega las respuestas al agotar el cupo gratis. |
| 6 | Aviso de privacidad y plazo de guarda | Con el área legal: cuánto se guardan las conversaciones y quién accede. |

## Fase 2 · Cuentas de producción (todas a nombre de la empresa)

- Cuenta del proveedor de servidor con verificación en dos pasos, alerta de gasto y facturación de
  la empresa. La cuenta raíz con un segundo método de verificación y sin uso diario.
- Claude Platform: llave nueva **"Bot <Cliente> - producción"** en su workspace, con tope mensual.
- Meta: **token permanente de producción** de un usuario del sistema con permisos solo de WhatsApp.
- HubSpot: clave con los permisos mínimos que usa el bot (contactos y, si aplica, negocios,
  tareas, notas y archivos). Verificación en dos pasos obligatoria en el portal.

## Fase 3 · Servidor seguro

| # | Paso | Cómo sabemos que quedó |
|---|---|---|
| 1 | Crear el servidor: AWS Lightsail 2 GB (≈ USD 12/mes) o EC2 t4g.micro; o Azure B1s. Región México, disco cifrado, **IP fija**. | Servidor en línea con IP fija. |
| 2 | Firewall: solo **443** (HTTPS) y **80** (para redirigir y renovar el certificado). El **22** cerrado a internet: se administra desde la consola del proveedor tras la verificación en dos pasos. | Desde afuera solo responden 80 y 443. |
| 3 | Actualizaciones automáticas de seguridad del sistema operativo. | Servicio activo. |
| 4 | Subdominio del cliente (ej. `bot.cliente.com`) apuntando a la IP. | Responde con la IP del servidor. |
| 5 | **Nginx + certificado Let's Encrypt** con renovación automática, TLS 1.2/1.3, http→https y HSTS. El bot escucha solo dentro del servidor, detrás de Nginx. | Candado en el navegador. |
| 6 | Usuario del servicio **sin permisos de administrador**; Node y el código en una carpeta con fecha (`versiones/2026-11-03`) y un acceso "actual". | El bot arranca con ese usuario. |
| 7 | Claves en un archivo fuera de la carpeta del código que solo lee el usuario del bot (o en el almacén de parámetros cifrados del proveedor). | La configuración solo la lee el usuario del bot. |
| 8 | Arranque automático y reinicio si se cae (servicio del sistema). | Se reinicia el servidor y el bot vuelve solo. |
| 9 | Prueba real de la IA al arrancar. | "IA: activa" y la llamada en `costos.jsonl`. |
| 10 | **Estado de cada conversación en disco** (respuestas, calificación, pregunta pendiente, hora del último mensaje) y lista de IDs de mensajes ya contestados. Al arrancar se leen y cada conversación sigue donde iba; los recordatorios de 2 h y 24 h se calculan con la hora guardada. | Reiniciar a mitad de una charla y que siga. |
| 11 | **Volver a la versión anterior** en menos de 1 minuto: apuntar "actual" a la carpeta anterior y reiniciar. El estado guardado vive fuera de la carpeta de la versión y cada versión solo agrega datos. | Probar la vuelta con una conversación abierta. |
| 12 | **Vigilante fuera del servidor**: consulta `/estado` cada 5 minutos y, si no contesta dos veces seguidas, manda un correo al responsable. También avisa si HubSpot o la IA fallan varias veces seguidas. | Un aviso de caída de prueba. |
| 13 | Respaldos automáticos (snapshots, ≈ USD 2/mes). | Una restauración de prueba. |
| 14 | `/costos` fuera de internet; `/estado` solo para el vigilante; `/webhook` rechaza (401) todo lo que no venga firmado por Meta. | Probado desde afuera. |
| 15 | Modo producción **sin túnel** (entra por el subdominio) y `AMBIENTE=produccion` (en Logisa: en producción no se guardan Word en Dropbox y el resumen en HubSpot no lleva la marca `[PRUEBA]`). | — |

Trabajo estimado en Logisa para los puntos 10–12: **2 a 3 días** más la prueba en el servidor.

## Fase 4 · El número definitivo en WhatsApp

Pasos estándar de Meta (verificar los nombres de los menús en pantalla):

1. **Dar de alta el número** en la cuenta de WhatsApp Business del cliente: business.facebook.com ›
   Administrador de WhatsApp › Teléfonos › Agregar número. Se verifica por SMS o llamada.
   - El número **no puede estar activo en la app de WhatsApp** (normal o Business). Si lo está, hay
     que borrar esa cuenta antes o migrarlo.
   - Si el número lo tiene otro proveedor (un BSP como Patagon), se pide la **migración** o la
     baja del número en esa cuenta. Mientras dos apps escuchen el mismo número, contestan dos bots.
2. **Nombre visible** (*display name*): Meta lo revisa y lo aprueba. Tiene que coincidir con la
   marca.
3. **Verificación del negocio** en el portafolio (documentos de la empresa): sube los límites de
   conversaciones que inicia la empresa y habilita el nombre verificado.
4. **Método de pago** en la cuenta de WhatsApp (Administrador de WhatsApp › Facturación).
5. **Registrar el número para la API** con su PIN de verificación en dos pasos y copiar su nuevo
   *Phone number ID*.
6. Foto de perfil, descripción y horario del perfil de empresa.
7. **Plantillas** para escribir fuera de la ventana de 24 h (seguimiento, recordatorio de reunión,
   pedido de documentos): se crean y Meta las aprueba. Se cobran aparte.
8. App en **modo Activo** (publicada): requiere la URL de la política de privacidad.

## Fase 5 · Salida a clientes

| # | Paso |
|---|---|
| 1 | En el `.env` del servidor: el `WHATSAPP_PHONE_NUMBER_ID` del número definitivo y el token de producción. **Es lo único del bot que cambia** respecto de las pruebas. |
| 2 | Webhook de Meta apuntando a `https://bot.cliente.com/webhook` (el túnel deja de usarse). |
| 3 | Prueba final con números internos: una conversación por servicio en el número definitivo. |
| 4 | Apagar el túnel de pruebas: la compu deja de recibir mensajes. |
| 5 | Publicar el número: botones de la web (`https://wa.me/<número>`), anuncios, firma de correo. |
| 6 | Página de reuniones del vendedor con "Redirect to another page" a `wa.me/<número>`. |
| 7 | **Revisión de la primera semana**: conversaciones, calificaciones contra el SDR y costos reales. |

## Cómo se mide el éxito (definir antes de salir)

De cada 100 conversaciones del mes: cuántas llegan a calificación 4–5, cuántas agendan reunión
**después** de la conversación del bot y cuántas pasan a Oportunidad **después** de la conversación.
Hace falta la propiedad "fecha de la conversación del bot" y que el SDR mueva el contacto a
Oportunidad. La meta se fija después del primer mes con datos reales.
