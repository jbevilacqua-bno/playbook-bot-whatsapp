# 4 · Conectar HubSpot

Tiempo: ~15 minutos. No hace falta WhatsApp para esto: se prueba con el simulador.

## Paso 1 · Sacar la clave de HubSpot

> ⚠️ **Cambio de HubSpot (26-oct-2026):** en cuentas existentes ya no se pueden crear
> *aplicaciones privadas heredadas* (las que ya existen siguen andando). El reemplazo son las
> **claves de servicio**. En Logisa la clave del bot se creó así.

1. Entrar a HubSpot como **superadministrador** (si no lo sos, pedíselo a quien lo sea).
2. Engranaje (Configuración) › **Desarrollo › Claves › Claves de servicio** › crear clave.
   Nombre: `Bot <Cliente>`.
   *(En cuentas que todavía lo permitan: Configuración › Integraciones › Aplicaciones privadas ›
   Crear una aplicación privada.)*
3. Permisos mínimos: **leer y escribir contactos** y **leer el esquema de contactos**
   (propiedades). Las notas se crean con los permisos de contactos. Si el bot va a crear tareas,
   negocios o subir archivos, sumar esos permisos y **nada más**.
4. Copiar la clave (empieza con `pat-`). Es secreta: no va por correo ni por chat.

⚠️ **Nunca usar una clave de administrador de todo el portal en el bot ni en un sitio web.** Si la
única clave disponible es de administrador, se crea una nueva con permisos mínimos.

## Paso 2 · Pegarla en la configuración

1. Doble clic en `INICIAR-BOT.cmd`. La primera vez crea el archivo de configuración y lo abre en el
   Bloc de notas (`%USERPROFILE%\.bot-<cliente>\.env`). Cerrar la ventana negra.
2. Cambiar `HUBSPOT_MODO=simular` por `HUBSPOT_MODO=real`.
3. Pegar la clave en `HUBSPOT_TOKEN=pat-…`, sin espacios.
4. Guardar y cerrar.

`simular` no toca HubSpot: guarda en `registros/hubspot/` lo que mandaría. Sirve para revisar el
envío antes de escribir en el portal real.

## Paso 3 · Probar con el simulador

1. Abrir `ABRIR SIMULADOR`. La ventana tiene que decir **"HubSpot: REAL"**.
2. Hacer una conversación completa hasta dar nombre, empresa y un correo de prueba.
3. Esperar **90 segundos** después del último mensaje (el bot espera por si la persona agrega algo).
4. En la ventana: "contacto … creado" y "nota con la conversación agregada".
5. En HubSpot › Contactos buscar el correo: calificación, BANT con su porqué y **una sola nota**
   con toda la conversación (los dos lados).

## Propiedades del bot

Crear un **grupo de propiedades propio** (en Logisa: `bot_logisa`) con lo que el bot escribe:
servicio(s), calificación del bot, nivel, BANT con su porqué, origen (`Pruebas` / `Producción`),
resumen y notas de la conversación, enlaces a documentos, y lo propio de cada servicio.

Reglas que nos costaron:
- **La lista real de lo que el bot escribe sale del código** (la función que arma las
  propiedades), no de un Excel ni de un Word. Antes de crear propiedades, comparar contra el código.
- **Verificar por API que cada propiedad existe** antes de conectar: si el bot manda una que no
  existe, HubSpot rechaza la escritura **entera**. El bot debe filtrar lo que no existe y avisar
  ("se dejaron fuera: …") en vez de perder el contacto.
- Para desplegables, el bot manda el **valor interno**, no la etiqueta (sin acentos ni espacios
  de más). Marcas internas como "(dicho al inicio)" hacen que el desplegable rechace el valor.
- Crear la propiedad **"fecha de la conversación del bot"** desde el día uno: sin ella no se
  pueden contar por mes las conversaciones de contactos que ya existían.
- **No sobrescribir el CRM**: si el correo ya existe, no se pisan nombre, empresa, teléfono ni
  puesto que tienen valor. (Buscar por correo y actualizar todo cambió nombres de contactos reales.)
- Una conversación = **una nota** que se actualiza, no una nota por mensaje.
- La empresa va en la propiedad `company` del contacto (no en el objeto Compañía) salvo que el
  cliente pida otra cosa.

## Workflows: revisar los que ya existen

Los workflows del portal pueden ignorar al bot nuevo o, al revés, dispararse con sus pruebas:
- En Logisa el workflow que creaba negocios solo inscribía contactos cuya fuente era la
  integración del proveedor anterior: con una clave propia el bot no creaba negocio ni se asignaba
  al vendedor. Hubo que sumar el disparo por las propiedades del bot.
- Ningún workflow filtraba `origen = Pruebas`: los contactos de prueba pasaban por asignación,
  avisos al director y creación de negocios. **Filtrarlos o limpiarlos al terminar.**
- Un workflow de **calificación final** (la del SDR si existe, si no la del bot) con una segunda
  pasada a los 2 minutos: sin ella se pierde el cambio que llega con el contacto ya inscrito.

## Si algo falla

| Lo que se ve | Qué hacer |
|---|---|
| "HubSpot: apagado" | No quedó `HUBSPOT_MODO=real` o no se guardó el archivo. |
| "token inválido" o 401 | La clave se pegó incompleta o con espacios. |
| 403 o "sin permiso" | Falta un permiso en la clave. |
| "se dejaron fuera" | Falta una propiedad o un valor de desplegable en el portal. |
| No aparece "contacto creado" a los 90 s | La conversación no llegó al correo o se cerró la ventana antes. |
| El contacto llega sin dueño | Lo asigna un workflow minutos después; esperar antes de decir que no llegó. |

## Regreso a WhatsApp después de agendar

En la página de reuniones del vendedor (HubSpot › Reuniones): después de agendar, **"Redirect to
another page"** a `https://wa.me/<número del bot>` para que el cliente vuelva a la conversación.
