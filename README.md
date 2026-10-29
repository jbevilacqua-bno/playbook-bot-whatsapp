# Playbook BnO · Bot de WhatsApp calificador de prospectos

Cómo construimos desde cero un bot de WhatsApp que atiende a quien escribe, le hace las
preguntas de calificación, contesta solo con información autorizada, califica con BANT y deja
la ficha en el CRM (HubSpot). Es lo que aprendimos en la cuenta **Logisa** (sep–oct 2026), escrito
para **repetirlo en otras cuentas**.

> Este repo no explica *qué* contesta el bot de Logisa (eso es de ese cliente). Explica *cómo se
> arma*: qué cuentas se abren, qué llaves se sacan y dónde se pegan, cómo se prueba con gente
> real antes de salir y cómo se pasa al número definitivo.

## El principio que manda

**La IA entiende; el código decide.** El flujo, las preguntas, los textos y la calificación
viven en código (determinista, se puede probar). La IA solo traduce lo que escribió la persona
a una ficha cerrada (qué servicio, qué presupuesto, quién decide, cuándo). Si la IA falla o
tarda, contestan las reglas y el cliente nunca se queda sin respuesta.

## Por dónde empezar

| # | Documento | Para qué |
|---|---|---|
| 0 | [Visión general y arquitectura](docs/00-vision-general.md) | Las piezas y cómo se conectan. Leer primero. |
| 1 | [Arranque con el cliente](docs/01-arranque-con-el-cliente.md) | Cuestionario de 13 temas, qué da el cliente y qué reutilizamos. |
| 2 | [Construir la lógica](docs/02-construir-la-logica.md) | Motor determinista, bases autorizadas, BANT, tono y casos difíciles. |
| 3 | [Simulador y pruebas](docs/03-simulador-y-pruebas.md) | La pantalla de celular para probar, la liga para probadores y las baterías. |
| 4 | [Conectar HubSpot](docs/04-conectar-hubspot.md) | Clave, permisos, propiedades y nota con la conversación. |
| 5 | [Conectar la IA (Claude)](docs/05-conectar-ia-claude.md) | Cuenta, pago, tope de gasto, llave y modelo. |
| 6 | [App de Meta y número de prueba](docs/06-meta-app-y-numero-de-prueba.md) | developers.facebook.com, caso de uso, 5 teléfonos de prueba, token permanente. |
| 7 | [Servidor de prueba con túnel](docs/07-servidor-de-prueba-con-tunel.md) | Correr el bot en una compu con una URL HTTPS de Cloudflare. |
| 8 | [Pasar a producción](docs/08-produccion.md) | Servidor fijo, dominio, número definitivo, pago y publicación. |
| 9 | [Costos](docs/09-costos.md) | Cuánto sale por conversación y por mes. |
| 10 | [Problemas frecuentes](docs/10-problemas-frecuentes.md) | Cada error que ya nos pasó y cómo se resolvió. |
| 11 | [Método de trabajo](docs/11-metodo-de-trabajo.md) | Fases con puerta, control del proyecto, versiones y lecciones. |
| 12 | [Historia del caso Logisa](docs/12-historia-caso-logisa.md) | Cómo llegamos acá, en orden, para entender cada decisión. |

- **Checklist para ejecutar:** [checklists/checklist-bot-nuevo.md](checklists/checklist-bot-nuevo.md)
  (de la primera reunión a la primera semana en producción).
- **Plantilla de código:** [plantilla/](plantilla/README.md) — servidor de WhatsApp en Node.js sin
  dependencias, con simulador de celular, motor de ejemplo, conexión a HubSpot y a Claude, y los
  arrancadores de doble clic para Windows. Es el punto de partida de cada bot nuevo.

## Recorrido en una línea

Cuestionario con el cliente → reglas y textos aprobados → motor en código → simulador con
pantalla de celular → pruebas automáticas → probadores del cliente por liga → HubSpot real →
IA real → app de Meta con número de prueba (5 teléfonos) → bot en una compu con túnel HTTPS →
liberación firmada → servidor fijo con dominio propio → número definitivo con pago → publicar.

## Seguridad (no negociable)

- **Ninguna clave va en este repo, en un correo, en un chat ni en una captura.** Las claves viven
  en un archivo `.env` en la carpeta del usuario de Windows (`%USERPROFILE%\.bot-<cliente>\.env`),
  fuera de Dropbox y fuera del código.
- El `.gitignore` de la plantilla ya excluye `.env`, `registros/` y `sesiones/`.
- Usar datos ficticios en las pruebas: en Logisa una prueba escribió sobre contactos reales de
  HubSpot.

---
Preparado por Julián Bevilacqua (BnO) con Claude, 29-oct-2026. Fuentes: el handoff a Alejandro
Gil (Logisa) del 23-sep-2026, las guías del 1 y 5-oct, y la documentación que Alejandro fue
sumando hasta el 22-oct (guías de conexión, simulador, metodología de bots v5, SDD, paso a
producción y costos).
