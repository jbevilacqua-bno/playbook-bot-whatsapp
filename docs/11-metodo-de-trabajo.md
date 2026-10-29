# 11 · Método de trabajo

Basado en la "Metodología de bots v5" que armó Alejandro Gil con Claude (20-oct-2026). Nada de esto
es propio de un cliente; cada bot lleva su propio control.

## Fases (cada una termina antes de empezar la siguiente)

| # | Fase | Qué incluye | Terminada cuando |
|---|---|---|---|
| 1 | Contexto de la empresa | Cuestionario de arranque contestado. | Confirmado por el dueño; toda duda es una P con código. |
| 2 | Reglas | Flujo, preguntas, casos fuera de orden, salidas, calificación y cierres, **cada regla con número**. | Reglas aprobadas y lista del revisor generada. |
| 3 | Simulador | Página que corre el mismo motor que el canal y guarda cada conversación. | Una conversación por servicio sin errores. |
| 4 | Pruebas sin IA | Casos automáticos y prospectos simulados con solo reglas. | 100 % de casos correctos (son previas: no validan solas). |
| 5 | Pruebas con IA | Todas las pruebas con la IA real; el revisor separa fallas de IA y de reglas. | Una corrida completa con IA sin errores reales. |
| 6 | Probadores | El equipo prueba con la liga del simulador y comenta dentro del Word. | Todos los comentarios revisados contra su conversación y cerrados. |
| 7 | **Liberación del ambiente (puerta)** | El ambiente de pruebas reproduce producción. | Firmada por el dueño, con fecha, respaldo del código y versión del control. |
| 8 | Infraestructura | Servidor siempre encendido, URL HTTPS fija, claves fuera del código, registros, respaldos, monitoreo. | El bot responde desde el servidor con el número de prueba. |
| 9 | Canal de producción | Número definitivo, token permanente, pago, webhook en la URL fija, plantillas. | Prueba final con números internos, una por servicio. |
| 10 | Producción | Se publica el número, se apaga el túnel, se revisa la primera semana. | Primera semana revisada. |

Variante que usó Alejandro para la v2 del bot (método **SDD**, *spec-driven development*):
Constitución (los principios que mandan sobre todo) → Especificación → Examen (30 conversaciones
con la respuesta correcta validada por el SDR) → Dudas → Plan técnico → Tareas → Construir y medir.
Cada fase la aprueba el dueño antes de pasar a la siguiente. El bot se mide contra el examen
**con código**, no con la opinión de otra IA.

## Reglas fijas para quien construye (persona o Claude)

1. **Hacé solo lo que se pide.** Si una instrucción choca con una decisión vigente o no está clara,
   preguntá antes.
2. **No suponer.** Leer el 100 % de las fuentes antes de escribir; si un dato no está, se marca 🔴 y
   se crea una P.
3. **No adelantarse.** "No se puede seguir: falta …" con lo que falta y su P.
4. **Respaldo antes de tocar archivos**: la versión actual pasa a "Versiones anteriores".
5. **Solo la versión actual y la inmediata anterior** de cada documento (lo más viejo se borra;
   las conversaciones y la bitácora no).
6. **Bitácora y "Decisiones vigentes"** con fecha: qué, por qué, archivos, número de regla y
   resultado de pruebas.
7. **Corregir por patrón** y **cada error se vuelve caso de prueba**.
8. Error cubierto por las reglas: se corrige y se reporta. Lo que no está en las reglas: P.
9. **Revisor al día**: cada cambio de reglas regenera la lista que usa el juez IA.
10. **Informe al terminar cada cambio**: versión anterior guardada, archivos, pruebas y qué reiniciar.
11. **Las claves nunca se copian**: solo se dice dónde viven.
12. Antes de una prueba con IA se dice cuánto cuesta.

## El control del proyecto

Un solo lugar de control por bot (en Logisa, un HTML "Control del bot" con buscador). Cada punto
tiene:

| Campo | Qué lleva |
|---|---|
| Código | `P-ÁREA-000` (pregunta para el dueño), `C-ÁREA-000` (comentario de probadores o equipo) o `ÁREA-00` (paso del checklist) |
| Tema, qué se decide, recomendación, decisión | — |
| Estado | 🔴 sin empezar · 🟡 iniciado · 🟢 terminado · ✔ contestada/atendida · ⏸ en espera |
| Autorizó / fecha · Ejecutó / fecha | **Sin los dos nombres no puede quedar en 🟢** |
| Evidencia | Archivo, reporte o conversación que lo prueba |
| Qué bloquea | Puntos que esperan esto |

Áreas: BOT (lógica y textos) · WA (WhatsApp) · HS (HubSpot) · IA · INF (infraestructura) ·
PRU (pruebas) · PRIV (privacidad) · OPS (operación) · MET (métricas) · GOB (responsables y costos).

Etapas: **1 · Pre-producción** (el ambiente de pruebas reproduce producción) y **2 · Producción**
(no empieza en ningún área hasta que la etapa 1 de todas esté 🟢 y el ambiente liberado).

## Trabajar con Claude

- Un **proyecto de Claude por bot** con: instrucciones (qué se busca, carpetas autorizadas, "no
  salir a internet", ser neutral con las marcas), la bitácora de decisiones y los criterios de
  calificación del cliente como archivos.
- El proyecto vive en la **cuenta de la empresa** (Claude Team), no en una personal: al pasar de
  una cuenta personal a la de la empresa con otro correo, el proyecto se recrea a mano.
- Un archivo **"Decisiones del bot"** con todas las reglas acordadas es lo que permite que Claude
  siga trabajando igual en otra cuenta. Prueba de control: hacerle 3 preguntas cuya respuesta solo
  está en ese archivo.
- La carpeta del proyecto (código, simulador, conversaciones) en un Dropbox compartido; las claves,
  fuera.

## Lecciones (resumen)

Corregir por patrón · mantener el revisor al día · preguntar antes de suponer · separar pruebas
sin IA y con IA · una corrida parcial no reemplaza una completa · pruebas sobre copia · una sola
numeración de reglas · revisar por qué terminó la respuesta de la IA · límite total de tiempo y
conexión nueva · no sacar marcas internas al CRM · no sobrescribir el CRM · un solo canal de
comentarios · el estado no puede vivir solo en memoria · los probadores usan la carpeta
sincronizada.
