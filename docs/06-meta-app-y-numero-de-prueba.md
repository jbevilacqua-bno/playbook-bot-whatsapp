# 6 · App de Meta y número de prueba

Objetivo: que el bot conteste en WhatsApp **sin tocar el número real del cliente**, usando el
número de prueba gratis que da Meta y hasta 5 teléfonos autorizados.

## Antes de empezar

- Quien hace los clics necesita **Facebook personal registrado como desarrollador de Meta** y
  **acceso total al portafolio comercial** del cliente (business.facebook.com). Meta no deja asignar
  una app a alguien que no se registró como desarrollador. Si el responsable técnico no tiene, lo
  hace un administrador del cliente compartiendo pantalla (en Logisa lo hizo un director con su
  Facebook).
- **Crear la app dentro del portafolio del cliente**: si la app y la cuenta de WhatsApp tienen el
  mismo dueño, no hace falta la revisión de la app (App Review) para mandar mensajes.
- Los secretos (token, clave secreta) se pasan por mensaje privado al responsable técnico, nunca
  al grupo.

## Paso 1 · Crear la app

1. `developers.facebook.com/apps` › **Crear app**.
2. Caso de uso: **"Conectar con clientes a través de WhatsApp"** (*Connect with customers through
   WhatsApp*). Es el único que hace falta.
3. Elegir el **portafolio comercial del cliente**.
4. Al terminar, Meta crea una cuenta de WhatsApp Business de prueba con un **número de prueba**
   (un +1 555…). Es gratis y no necesita método de pago.

## Paso 2 · Autorizar los teléfonos de prueba (máximo 5)

1. App › menú izquierdo › **Casos de uso** › "Conectar con clientes a través de WhatsApp" ›
   **Personalizar** › **Pruébalo** (en algunas cuentas: **Configuración de la API**).
2. Campo **Para** › **Administrar lista de números de teléfono** › Agregar › país › los dígitos
   del celular › Siguiente.
3. Al celular le llega un WhatsApp de Meta con un código de 5 dígitos; se escribe ahí › Verificar.
4. Repetir con cada probador (**5 como máximo**; para sumar a otro hay que sacar a alguien).
5. Prueba: elegir un número en "Para" › **Enviar mensaje**. Si llega el "Hello World" en inglés,
   el número funciona.

## Paso 3 · Juntar los 5 datos del bot

| # | Dato | Dónde está | Variable del `.env` |
|---|---|---|---|
| 1 | Identificador del número (*Phone number ID*) | Pruébalo / Configuración de la API, debajo del número | `WHATSAPP_PHONE_NUMBER_ID` |
| 2 | Identificador de la cuenta de WhatsApp (*WABA ID*) | Misma pantalla, debajo del dato 1 | `WHATSAPP_WABA_ID` |
| 3 | Identificador de la app (*App ID*) | Configuración de la app › Básica | `WHATSAPP_APP_ID` |
| 4 | Clave secreta de la app (*App secret*) | Misma pantalla › Mostrar (pide la contraseña de Facebook) | `WHATSAPP_APP_SECRET` |
| 5 | Token permanente | Ver paso 4 | `WHATSAPP_TOKEN` |

Además, `WHATSAPP_VERIFY_TOKEN` **no sale de Meta: se inventa** (una frase cualquiera). Tiene que
ser idéntica en el bot y en el webhook de Meta.

En la misma pantalla Básica, cargar la **URL de la política de privacidad** del cliente y guardar
(Meta la pide para pasar la app a modo activo).

> El botón "Generar token de acceso" de la pantalla Pruébalo da un **token temporal que vence en
> horas**. Sirve para probar ese día. Al día siguiente el bot recibe pero no puede contestar
> (error 190). Por eso el paso 4 es obligatorio.

## Paso 4 · Token permanente (usuario del sistema)

1. `business.facebook.com` › Configuración › **Usuarios › Usuarios del sistema** › **+ Agregar**.
   Nombre sin guiones de más (ej. `botclienteservidor`), rol **Administrador**.
2. Con el usuario seleccionado › **Asignar activos**:
   - Apps › la app del bot › **Control total**.
   - Cuentas de WhatsApp › la cuenta cuyo ID coincide con el dato 2 › **Control total**.
3. **Generar token** › app del bot › caducidad **Nunca** › permisos `business_management`,
   `whatsapp_business_management` y `whatsapp_business_messaging` › Generar.
4. Copiarlo en ese momento (empieza con `EAA`; Meta lo muestra una sola vez).

Para producción se genera otro token con permisos **solo de WhatsApp**.

## Paso 5 · El webhook (lo hace el bot solo)

Meta manda cada mensaje a una URL HTTPS: el webhook del bot (`https://…/webhook`). En la plantilla
(y en el bot de Logisa) **el servidor lo registra solo al arrancar**:

1. Abre el túnel y obtiene la URL pública.
2. Llama a la Graph API: `POST /{APP_ID}/subscriptions` con `object=whatsapp_business_account`,
   `callback_url=<url>/webhook`, `verify_token`, `fields=messages` y el token de app
   (`APP_ID|APP_SECRET`).
3. Llama a `POST /{WABA_ID}/subscribed_apps` para suscribir la cuenta de WhatsApp a la app.
4. Meta verifica con un GET a `/webhook?hub.mode=subscribe&hub.verify_token=…&hub.challenge=…` y el
   bot devuelve el `challenge`.

Si el registro automático falla, se hace a mano: app › Casos de uso › WhatsApp › Personalizar ›
**Configuración** › Webhook › Editar › pegar la URL completa (`https://….trycloudflare.com/webhook`)
y el token de verificación › **Verificar y guardar** › en **Campos del webhook** › Administrar ›
suscribir **solo `messages`**.

## Paso 6 · Probar desde el celular

1. En un celular autorizado abrir `https://wa.me/<número de prueba sin + ni espacios>` › escribir
   "Hola".
2. En la ventana del bot aparece el mensaje que entra (←) y el que sale (→).
3. Seguir la charla con datos ficticios y revisar que el contacto llegue a HubSpot.
4. Para empezar de cero: escribir `/reset` en el mismo WhatsApp ("reiniciar" a secas no alcanza
   si el motor conserva el lead a propósito).

## Opcional: que no dependa de una sola persona

App › **Roles de la app** › Agregar personas › Administrador › el Facebook de otra persona (tiene
que estar registrada como desarrolladora y aceptar en `developers.facebook.com/requests`).

## Lo que hay que saber del número de prueba

- Solo contesta a los **5 teléfonos dados de alta**.
- Meta lo da gratis (en Logisa se informó una vigencia de 90 días; confirmarlo en la app).
- **Una sola URL recibe los mensajes.** Si otra persona abre el bot en su compu, Meta pasa a
  mandarle los mensajes a ella y la compu del responsable deja de recibir. Regla: **solo el
  responsable abre `INICIAR-BOT`**; el resto prueba desde su celular o con el simulador.
- **Gotcha México/Argentina**: WhatsApp entrega el remitente como `521…` (MX) o `549…` (AR), pero la
  lista de Meta lo guarda sin ese dígito (`52…`, `54…`). Al contestar da error **131030** "Recipient
  phone number not in allowed list". El servidor prueba las dos formas y recuerda la que funcionó
  (ya resuelto en la plantilla).
