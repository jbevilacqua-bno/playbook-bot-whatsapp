# 0 · Visión general y arquitectura

## Qué hace el bot

Un **bot calificador** atiende a quien escribe por WhatsApp, hace las preguntas de calificación
en un orden fijo, contesta dudas **solo con información autorizada**, califica con un método
explícito (**BANT**: presupuesto, autoridad, necesidad y fecha) y entrega una **ficha al SDR** en
el CRM. En las calificaciones altas manda el enlace para agendar una reunión.

No vende, no cotiza, no recomienda marcas y no da precios. Junta los datos para que la persona
de ventas llegue a la reunión sabiendo con quién habla.

## Las piezas

```
 Persona en WhatsApp
        │  escribe
        ▼
 ┌──────────────────────┐   webhook (HTTPS, firmado)    ┌──────────────────────────────┐
 │  Meta · WhatsApp     │ ─────────────────────────────▶ │  Servidor del bot (Node.js)  │
 │  Cloud API           │ ◀───────────────────────────── │  /webhook  /estado  /costos  │
 └──────────────────────┘   respuesta (Graph API)        └──────────────┬───────────────┘
                                                                        │
                       ┌────────────────────────────┬──────────────────┼──────────────────┐
                       ▼                            ▼                  ▼                  ▼
            ┌───────────────────┐       ┌──────────────────┐  ┌────────────────┐  ┌───────────────┐
            │ Intérprete (IA)   │       │ Motor (código)   │  │ HubSpot (CRM)  │  │ Registros     │
            │ Claude: mensaje → │ ────▶ │ flujo, textos,   │─▶│ contacto + nota│  │ Word por      │
            │ ficha JSON cerrada│       │ BANT 0–5, cierres│  │ con la charla  │  │ conversación, │
            └───────────────────┘       └──────────────────┘  └────────────────┘  │ costos.jsonl  │
              (opcional: si falla,                                                 └───────────────┘
               contestan las reglas)
```

| Pieza | Qué es | Dónde se explica |
|---|---|---|
| **Motor** | Código puro, sin pantalla: decide la siguiente pregunta, guarda cada dato en su lugar, califica y elige el cierre. **Una sola implementación** para el simulador, la consola y WhatsApp. | [02](02-construir-la-logica.md) |
| **Intérprete (IA)** | Por cada mensaje, Claude lee el mensaje con la pregunta pendiente y lo ya sabido, y devuelve una ficha JSON con opciones cerradas. No redacta lo que ve el cliente. | [05](05-conectar-ia-claude.md) |
| **Servidor** | Programa Node.js que recibe el webhook de Meta, verifica la firma, pasa el mensaje al motor y manda la respuesta por la Graph API. | [07](07-servidor-de-prueba-con-tunel.md) |
| **Túnel** | En pruebas, Cloudflare (`cloudflared`, gratis y sin cuenta) le da a la compu una URL `https://…trycloudflare.com` que Meta acepta. En producción se reemplaza por un dominio propio. | [07](07-servidor-de-prueba-con-tunel.md) |
| **Simulador** | Página con forma de celular que corre el **mismo motor**; guarda cada conversación en Word; se comparte por liga con los probadores. | [03](03-simulador-y-pruebas.md) |
| **HubSpot** | Crea o actualiza el contacto por correo, llena las propiedades del bot y deja **una nota** con toda la conversación. | [04](04-conectar-hubspot.md) |
| **Meta** | App en developers.facebook.com con el caso de uso de WhatsApp, número (de prueba y después el definitivo), token permanente y método de pago. | [06](06-meta-app-y-numero-de-prueba.md), [08](08-produccion.md) |
| **Configuración** | Un `.env` por computadora, fuera del código y de Dropbox, con todas las claves. | [plantilla](../plantilla/README.md) |

## Por qué así (decisiones que costaron)

1. **Determinista primero.** El cliente pidió explícitamente que el bot no dependiera de una IA
   para responder: el flujo y los textos son aprobados por el cliente y tienen que salir siempre
   iguales. Un bot 100 % en código se prueba con miles de conversaciones gratis.
2. **La IA como traductora, no como redactora.** El texto libre de WhatsApp ("se nos va la luz y
   se apagan los servidores") rompe cualquier diccionario. La IA lo convierte a frases que el
   motor ya entiende ("Necesito un UPS"). Así se gana comprensión sin perder control.
3. **Un solo motor para todos los canales.** Si el simulador y WhatsApp tienen lógica distinta,
   lo que se prueba no es lo que sale. En Logisa el popup de la web, el simulador y WhatsApp
   cargan el mismo archivo.
4. **Nada vive solo en memoria en producción.** Un reinicio del servidor cortaba las
   conversaciones abiertas. El estado de cada conversación se escribe en disco.
5. **Las claves nunca se copian.** Se dice dónde viven, nunca se pegan en documentos ni chats.

## Ambientes

| Ambiente | Dónde corre | Número | Quién puede escribir |
|---|---|---|---|
| Simulador | La compu del responsable (y por liga) | — | Cualquiera con la liga |
| Prueba en WhatsApp | La compu del responsable + túnel | Número de prueba de Meta (gratis) | Hasta **5 teléfonos** dados de alta |
| Producción | Servidor siempre encendido (AWS/Azure/Railway) con dominio propio | Número definitivo del cliente | Todo el mundo |

La **liberación del ambiente de pruebas** es una puerta: no se monta producción hasta que el
ambiente de pruebas reproduce producción (CRM real, IA real, mismas reglas) y el dueño firma.
