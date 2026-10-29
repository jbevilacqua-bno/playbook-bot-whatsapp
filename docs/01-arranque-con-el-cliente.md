# 1 · Arranque con el cliente

Antes de escribir una línea de código hay que tener las respuestas de este cuestionario. **Cada
respuesta que falte se anota como una pregunta con código** (P-ÁREA-000, ver
[método de trabajo](11-metodo-de-trabajo.md)) y bloquea lo que dependa de ella. No se supone nada.

## Cuestionario de arranque (13 temas)

| # | Tema | Qué se pide |
|---|---|---|
| 1 | Página web de la empresa | Se lee completa y se confirma con el dueño qué hace la empresa en cada servicio. |
| 2 | Servicios | Lista de servicios, **cómo los nombra el cliente final** (no cómo los nombra la empresa) y qué no se atiende. |
| 3 | Preguntas por servicio | De 1 a 5 preguntas técnicas por servicio, en orden. |
| 4 | Bases de conocimiento | Respuestas autorizadas, cada una con su código. Lo que no está ahí se deriva a la reunión. |
| 5 | Criterios de calificación | Escala de cada variable con frases de ejemplo y topes (por ejemplo, cobertura geográfica). |
| 6 | Textos dictados | Apertura, preguntas, cierres por nivel, despedida y salidas (proveedores, empleo, fallas, reclamos). |
| 7 | SDR y responsables | Quién recibe la ficha, quién decide, quién autoriza y quién ejecuta cada punto. |
| 8 | CRM | Cuál, propiedades y valores exactos de los desplegables, negocios, tareas, permisos, quién lo administra. |
| 9 | Canal | Número de WhatsApp, quién tiene la cuenta de Meta (WABA), método de pago, plantillas, teléfonos de prueba. |
| 10 | IA | Proveedor, cuenta **de la empresa**, modelo, tope de gasto, quién guarda la llave. |
| 11 | Infraestructura | Proveedor del servidor, dominio, quién responde si se cae. |
| 12 | Privacidad | Aviso de privacidad (va antes de pedir datos), plazo de guarda de conversaciones y accesos. |
| 13 | Métricas | Cómo se mide la conversión y quién la reporta. |

## Qué da el cliente y qué reutilizamos

| Qué | ¿Se da o se reutiliza? | Qué incluye |
|---|---|---|
| Contexto de la empresa | **Lo da el cliente** | Quién es, qué vende, dónde trabaja, a quién no atiende. |
| Servicios y cómo se reconocen | **Lo da el cliente** | Palabras que identifican cada servicio y errores de dedo comunes. |
| Preguntas por servicio | **Lo da el cliente** | 1 a 5 por servicio, en orden. |
| Bases de conocimiento | **Lo da el cliente** | Las únicas respuestas que el bot puede usar. |
| Criterios de calificación | **Lo da el cliente** | Escala con ejemplos y topes. |
| Textos dictados y tono | **Lo da el cliente** | Tú o usted, palabras prohibidas, cierres. |
| Integraciones | **Lo da el cliente** | CRM, app de Meta, cuenta de IA, servidor. |
| Motor del flujo y del cálculo | **Se reutiliza** | Orden fijo, repregunta única, datos fuera de orden, varios datos en un mensaje, recalificación. |
| Uso de la IA | **Se reutiliza** | Opciones cerradas, JSON, 15 s de límite, reintentos, reglas de respaldo, texto del prospecto como dato. |
| Pruebas | **Se reutiliza** | Casos automáticos, personas simuladas, banco de pruebas base, revisor IA. |
| Simulador y registro | **Se reutiliza** | Pantalla de celular, liga para probadores, Word por conversación. |
| Método de trabajo | **Se reutiliza** | Fases con puerta, control, bitácora y versiones. |

## Las cuatro cosas que bloquean todo (resolverlas en la primera semana)

1. **¿Quién tiene la cuenta de WhatsApp Business (WABA) del número?** En Logisa el número lo
   tenía el proveedor anterior (Patagon). Dos apps escuchando el mismo número = dos bots
   contestando. Hay que saber si el número se libera o se usa uno nuevo.
2. **¿Quién es administrador del portafolio de Meta (business.facebook.com)?** Meta no deja
   asignar una app a alguien que no se registró como desarrollador. Si el responsable técnico no
   tiene Facebook, alguien con acceso total hace los clics compartiendo pantalla.
3. **¿Quién crea la clave de HubSpot?** Hace falta un superadministrador.
4. **¿Con qué tarjeta se paga?** Meta (desde el 1-oct-2026 cobra cada mensaje de servicio y sin
   método de pago deja de entregar al agotar el cupo gratis) y Claude Platform.

## Lo que aprendimos del cliente

- Los textos los aprueba el cliente, palabra por palabra. Un guion en Excel del cliente se
  aplica **editando solo textos de preguntas existentes y sus botones**, mostrando antes una
  tabla "hoy / nuevo".
- Si hubo un proveedor anterior, juntar **todas** sus correcciones (en Logisa: 19 hilos de
  "Fix #N / Mejora #N" a Patagon) y convertirlas en frases vetadas con su origen citado. El bot
  propio repitió el error más grande que el cliente le había reclamado al proveedor anterior
  hasta que se armó ese guardián.
- Conseguir 20 o 30 conversaciones reales (del bot anterior o de los vendedores) para usarlas
  como casos de prueba desde el día uno.
