# 5 · Conectar la IA (Claude Platform)

Sin IA, el bot contesta con sus reglas. Con IA, entiende las respuestas libres (servicio,
presupuesto, participación en la decisión, fecha, nombre y empresa). **No hace falta escribir
ningún prompt en la consola**: las instrucciones para la IA viven dentro del código del bot. En la
consola solo se crea la cuenta, se paga, se pone el tope y se genera la llave.

> Claude Platform (antes "Claude Console", `platform.claude.com`) es donde se paga la IA del bot.
> Es distinta de claude.ai, donde se conversa con Claude.

## Paso 1 · Cuenta de la empresa (no personal)

- La cuenta la crea **un correo de la empresa del cliente** (en Logisa: el de facturación), así el
  pago y las facturas quedan en la empresa y la llave sigue siendo de ellos si cambia el
  responsable.
- El responsable técnico entra **invitado con rol Admin** (Settings › Members › invitar ›
  rol Admin). Con ese rol crea llaves y maneja límites. La invitación dura tres semanas.
- Nombre de la organización: el de la empresa.

## Paso 2 · Pago y créditos

- Settings › **Billing** › agregar la tarjeta de la empresa › **Buy credits**. Para pruebas
  alcanza con USD 20.
- **Auto-reload (recarga automática) apagada** mientras se prueba: nunca se cobra de más sin
  decidirlo.

## Paso 3 · Tope de gasto

- Settings › Billing › **Spend limits** › Set limit › monto mensual (ej. USD 20 en pruebas).
- Si se alcanza el tope, **la IA se pausa y el bot sigue con sus reglas. Nada se rompe.**
- Recomendado: dos *workspaces* (Settings › Workspaces › Add Workspace): "Bot <Cliente> - pruebas"
  y "Bot <Cliente> - producción", cada uno con su límite. Así se ve por separado lo que gasta cada
  ambiente.

## Paso 4 · La llave

- Settings › **API keys** › Create key › nombre `Bot <Cliente> - pruebas` › workspace de pruebas.
- Si aparece "Linked account", elegir una **cuenta de servicio**: la llave no se cae si la persona
  que la creó deja la empresa.
- Copiarla en ese momento (empieza con `sk-ant-`; la consola la muestra una sola vez).
- **La llave es como una tarjeta de crédito**: no va por chat, correo ni WhatsApp, ni en Word, ni en
  Dropbox, ni se le pega a Claude en una conversación. Solo va en el `.env`.

## Paso 5 · Pegarla en la compu del bot

1. Windows + R › `notepad %USERPROFILE%\.bot-<cliente>\.env` › Enter.
2. `ANTHROPIC_API_KEY=` + la llave (sin espacios ni comillas) y `MODELO_IA=claude-sonnet-5-5`.
3. Guardar, cerrar, y **reabrir** las ventanas negras (bot y simulador).
4. Tiene que decir **"IA: activa (claude-sonnet-5-5)"** y en el simulador aparece el interruptor
   "IA interpreta texto libre".

Cada probador que corra el simulador en su compu necesita la llave en su propio `.env`. Con la
**liga para probadores** no: usan la IA de la compu del responsable.

## Cómo se usa la IA dentro del bot (reutilizable)

- **Una consulta por mensaje del cliente**, con: la pregunta pendiente, el último mensaje del bot,
  lo que ya se sabe y el mensaje del cliente.
- La IA devuelve **solo un JSON cerrado**: intención (contesta, duda, pide persona, se va, reclamo,
  falla, ¿eres bot?, saludo, otro idioma…), los datos que el cliente dio **en ese mensaje**
  (nombre, empresa, correo, presupuesto, participación, meses al inicio, documentos, urgente) y un
  `texto_claro`: el mensaje reescrito con **frases exactas que el motor ya entiende**
  ("El presupuesto está aprobado.", "Queremos iniciar en 3 meses.").
- El código **ajusta después** lo que la IA entendió con reglas fijas (bajas, proveedores,
  presupuesto vago) para que salga igual siempre.
- **15 segundos** de límite total por consulta, **2 reintentos** (a 1 s y 3 s) solo por red o
  errores 429/529/5xx, conexión nueva en cada intento. Después contestan las reglas.
- Revisar **por qué terminó** la respuesta: con poco espacio de salida llega cortada (en Logisa se
  subió de 200 a 1.024 tokens de salida).
- El texto del prospecto va **como dato**, con la orden de ignorar instrucciones que traiga.
- Cada consulta queda en `registros/costos.jsonl` (tokens, tiempo, fallas), **sin el texto** de
  la conversación.
- Al arrancar, el bot hace **una llamada real de prueba** (menos de USD 0,01) y avisa si la IA no
  responde.

## Costos de la IA

- Precio de Claude Sonnet 5.5 (el que usa el bot): **USD 2 por millón de tokens de entrada y USD 10
  por millón de salida** (documentación de Claude Platform, consultada en oct-2026; verificar al
  arrancar cada cliente).
- Logisa, medido: ~3 consultas por conversación, ~1.300 tokens de entrada y ~120 de salida por
  consulta → **menos de un centavo de dólar por conversación** (≈ USD 0,0084 medido en 8
  conversaciones). La tabla de presupuesto usa un tope prudente de USD 0,03.
- Una corrida completa de pruebas con IA: USD 1–3.

## Si algo falla

| Lo que se ve | Qué hacer |
|---|---|
| "IA apagada: falta ANTHROPIC_API_KEY" | La llave no está o quedó mal pegada. |
| No aparece el interruptor de IA en el simulador | Lo mismo; reabrir el simulador. |
| El bot contesta pero la ficha nunca muestra lo que interpretó la IA | Sin créditos o se alcanzó el tope: Settings › Billing. |
| "El modelo no existe" | Revisar en la consola el nombre exacto del modelo disponible. |
| "IA no respondió" | Llave incompleta o sin créditos; mientras tanto contestan las reglas. |
