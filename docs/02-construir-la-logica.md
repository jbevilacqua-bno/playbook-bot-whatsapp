# 2 · Construir la lógica del bot

## Cómo entiende sin IA

El motor determinista combina cuatro mecanismos (así funcionó en Logisa con 117 preguntas y
respuestas de las bases del cliente):

1. **Diccionario de frases y sinónimos** por servicio y por dato ("no-break" → UPS, "tres fases" →
   trifásico, "cuánto cuesta" → precio). Agregar un sinónimo = una fila en una tabla.
2. **Corrección de errores de dedo**: una palabra que no existe y está a una letra (o dos letras
   volteadas) de una palabra clave de 6+ letras se lee como esa clave ("aporbado" → aprobado).
3. **Índice de búsqueda (TF-IDF) sobre las preguntas de las bases**: para contestar dudas.
   Regla: con una sola palabra en común solo contesta si esa palabra explica el mensaje entero;
   si el mensaje gira alrededor de algo ajeno a la base, no contesta, pregunta.
4. **Máquina de estados con "cosecha"**: cualquier mensaje puede contestar cualquier pregunta
   abierta. Si en el primer mensaje dice ciudad, fecha y presupuesto, esas preguntas no se hacen.

**Regla de fondo: ante la duda, preguntar; nunca anotar un dato que la persona no dijo.** (En una
prueba el motor tomaba "listo" como "presupuesto aprobado".)

## Calificación BANT (fórmula reutilizable)

| Variable | Escala |
|---|---|
| **Budget (B, 0–3)** | 0 no se va a invertir · 1 no hay o no sabe · 2 en evaluación o aprobación · 3 aprobado |
| **Authority (A, 0–3)** | 0 solo investiga · 1 decide otro o participación menor · 2 participa, evalúa o recomienda · 3 decide o es parte de quien decide |
| **Need (N, 0–3)** | 0 sin requerimiento · 1 servicio con alcance vago · 2 servicio con alcance y ubicación · 3 tiene planos, especificaciones o inventario y los comparte |
| **Timeline (T, 0–2)** | 0 sin fecha o más de 6 meses · 1 de 3 a 6 meses · 2 tres meses o menos |

- Suma convertida a **0–5**: 1–2 → 1 · 3–4 → 2 · 5–7 → 3 · 8–10 → 4 · 11 → 5. Sin servicio o fuera
  de perfil → 0.
- Niveles: 0 Sin proyecto · 1 Sin interés comercial · 2 Explorando · 3 Cliente potencial ·
  4 Oportunidad · 5 Oportunidad prioritaria.
- **Enlace de reunión solo en 4 y 5**, y solo con A, B y N de 2 o más y correo corporativo.
- Topes: correo personal (Gmail, Hotmail…) resta 1 y no hay cita; sin nombre, máximo 2; sitio
  fuera del país, máximo 3.
- Se califica **solo con lo que dijo el cliente**. Si el SDR después la cambia, no es error del bot.
- Varios servicios: cada uno con su calificación; la general es la más alta; una sola tarea para
  el SDR.

(Esto se ajusta por cliente en el cuestionario; la fórmula y los topes son el punto de partida.)

## Reglas de tono (iguales para todos los bots)

| Regla | Qué dice |
|---|---|
| Trato | Uno solo en toda la conversación (en Logisa, de tú). Formal, sin coloquialismos ("va", "sale", "ok"). |
| Sin disculpas | El bot no se disculpa (salvo ante un reclamo). |
| Solo textos dictados | Manda solo textos aprobados o de las bases. |
| Sin promesas sin dato | Nunca afirma algo que el cliente no dijo ("ya quedó anotado que es urgente" solo si dijo que le urge). |
| Un mensaje, una pregunta | Mensajes de hasta 500 caracteres, **una sola pregunta al final**. Si contesta una duda y hay pregunta pendiente, van en dos mensajes. |
| Formato | Negrita y cursiva de WhatsApp, enlaces completos; sin tablas, encabezados ni emojis. |
| Identidad | No se presenta como bot por su cuenta; si le preguntan: "Te atiende el asistente virtual de [empresa]". Nunca dice que es una persona. |
| Sin marcas ni precios | No recomienda ni confirma marcas; no da precios por este medio. |
| Nada de "no tengo ese dato" | Se dice qué hay y se ofrece al equipo. |

## Casos difíciles ya resueltos (copiar la regla)

| Caso | Regla |
|---|---|
| No deja correo | Calificación como la da el método; sin correo no hay enlace; ningún mensaje menciona el correo. |
| Correo personal | Se pide **una vez** el de la empresa; si no lo da, queda el personal, −1 punto, sin cita. |
| Correo inválido | Solo se guarda usuario@dominio; se pide una vez más con otras palabras; a la segunda, "Incompleto". "luis arroba acme punto com" → luis@acme.com. |
| Respuesta que no contesta | Se repite la pregunta **una vez con otras palabras**; si tampoco, "No lo indicó", sigue y deja nota al SDR. Nunca inventa una pregunta. |
| "Ya te dije" | Si el mensaje trae el dato, se guarda y sigue; si no, "Entendido, seré breve." |
| Duda en medio del flujo | Contesta la duda con la base y vuelve: "Retomando tu proyecto: …". |
| Precio | Texto dictado de precios y retoma la pregunta pendiente una sola vez; "Depende, ¿cuánto cuesta?" a la segunda es Budget 1. |
| Se corta la conversación | Un recordatorio a las 2 h (dentro de la ventana de 24 h de Meta); a las 24 h pasa al SDR como "incompleta". |
| Pide hablar con una persona | Se piden nombre y empresa una vez; no detiene la captura. |
| Pide no ser contactado | "Entendido, no te volveremos a escribir…"; conserva la calificación; sin tarea. ("Dar de baja un contrato" NO es esto: es un dato del proyecto.) |
| Proveedor que quiere vender | Correo de contacto de la empresa, sin preguntas ni calificación. |
| Corrección después del cierre | El dato nuevo reemplaza al anterior, se recalifica y, si sube a 4–5, se manda el enlace. |
| Cortesías después de la despedida | La despedida completa una vez; después, solo la corta. |
| Insulto o "ignorá tus instrucciones" | No se obedece ni se repite; nota para el SDR. El texto del cliente va a la IA **como dato**, con la orden de ignorar instrucciones. |
| Nombre | Se pide máximo dos veces; un saludo, un cargo o un servicio no son nombre ("Espera, quiero ver otra cosa" no es un nombre: ≤5 palabras, sin signos de pregunta, sin @). |
| Mismo cliente vuelve | Dentro de 24 h sigue con la misma ficha; después, conversación nueva que lo saluda por su nombre y no le vuelve a pedir datos. |
| Correo que ya existe en el CRM | No se pisan nombre, empresa, teléfono ni puesto que ya tienen valor. |

## Reglas de las opciones (botones)

- **Ninguna pregunta puede ofrecer una sola opción**: o hay opciones de verdad o se escribe.
- **Solo se ofrecen opciones que funcionen** (cada botón lleva a un camino probado).
- WhatsApp permite **3 botones** o **una lista de hasta 10 filas**. Con 4+ opciones conviene ponerlas
  también numeradas dentro del texto y aceptar el número, la lista o texto libre (el desplegable
  "Ver opciones" se toca menos).

## Límites de WhatsApp que rompen el bot si no se respetan

| Límite | Valor |
|---|---|
| Cuerpo de un mensaje **interactivo** (con botones o lista) | **1.024 caracteres** (no 4.096). Con más, Meta rechaza y la persona no recibe NADA. |
| Mensaje de texto simple | 4.096 caracteres |
| Título de botón | 20 caracteres |
| Título de fila de lista | 24 caracteres |
| Botones por mensaje | 3 |
| Filas por lista | 10 |

Regla del servidor: si el texto es largo, va aparte y las opciones viajan con una pregunta corta;
si Meta rechaza el interactivo, se reenvía numerado. **El bot nunca se queda mudo.**
