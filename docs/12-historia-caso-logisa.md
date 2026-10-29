# 12 · Historia del caso Logisa (para entender cada decisión)

Logisa (infraestructura crítica) y Opton (su unidad que vende UPS y aires de precisión) tenían
bots de WhatsApp de proveedores externos (Atom, después Patagon) que nunca llegaron al resultado:
mandaban enlace de agenda a quien no correspondía, mezclaban la oferta y cada corrección tardaba.

| Fecha (2026) | Qué pasó | Qué dejó |
|---|---|---|
| 4-sep | BnO evalúa construir un bot propio. Primer prototipo de Opton con Claude + catálogo, publicado como página de Claude que usa la cuenta de quien la abre (sin llave ni servidor). | Plantear el bot propio como *challenger*, no como reemplazo, y compararlo con conversaciones reales. |
| 21-sep | El cliente pide **sin IA**: "que esté todo en un código, base de datos". Se extrae un **motor determinista** que comparten el popup de la web y WhatsApp. | Un solo motor para todos los canales. |
| 21-sep | **Sale a WhatsApp**: app de Meta en el portafolio del cliente + **número de prueba** + `ARRANCAR.cmd` en la compu de Julián que levanta el bot y un **túnel de cloudflared**. El número real del proveedor siguió vivo. | El camino de prueba que se usa hasta hoy. Gotchas: 1.024 caracteres en interactivos, `521`/`549`, token de 24 h, URL del túnel que cambia. |
| 21–22-sep | Bot de Logisa determinista: diccionario + TF-IDF sobre las bases + máquina de estados + BANT. Baterías de prueba y guardián de frases vetadas con las correcciones históricas al proveedor. | Las baterías y el guardián. |
| 22-sep | La dirección decide **bot propio con IA**, liderado por **Alejandro Gil** (Logisa), con BnO acompañando WhatsApp/Meta. | Principio: **"la IA conversa; el código decide"**. |
| 23-sep | Handoff a Alejandro: contexto, prototipos, catálogo limpio, datos de Meta verificados. El director de marketing manda los requisitos: separar capa conversacional de búsqueda determinista, validar en WhatsApp real, aviso de privacidad antes de pedir datos. | — |
| 24-sep | El cliente da de baja el número del proveedor; el asesor determinista se monta en las 29 páginas de la web con envío a HubSpot por la API pública de formularios. | Plan B en la web mientras se termina el bot. |
| 30-sep | Alejandro pide las propiedades de HubSpot; 4 que el handoff daba por existentes no existían. Se crean 17 en un grupo propio y se ajustan los workflows. | Verificar por API, no confiar en documentos. |
| 1-oct | Guías para Alejandro: conectar Meta y HubSpot. Meta empieza a **cobrar los mensajes de servicio**. Alejandro arma el **servidor de prueba** con `INICIAR-BOT.cmd` (instala Node y cloudflared solo, registra el webhook solo), costos y checklist de producción. | Arrancadores de doble clic y `.env` fuera de Dropbox. |
| 2–5-oct | Alta en Meta con el Facebook de un director (Alejandro no tenía), app en el portafolio, 5 teléfonos autorizados, usuario del sistema y **token permanente**. Primera falla: el token temporal venció. | Token permanente desde el día uno. |
| 8–12-oct | **Simulador** con pantalla de celular en Dropbox compartido; tandas de testeo con Word marcado en rojo y comentarios. | Un solo canal de comentarios. |
| 9–13-oct | Claude Platform: cuenta de la empresa, tope de gasto, workspaces, llave de servicio; el proyecto de Claude pasa a la cuenta de la empresa. | Cuentas a nombre del cliente. |
| 16–17-oct | **Liga para probadores** por túnel con llave; comandos TOMAR/SOLTAR para el SDR; recordatorio a las 2 h e incompleta a las 24 h. | Probar sin instalar nada. |
| 19–20-oct | Tandas de prueba con la IA activa; **Metodología de bots v5** (genérica), control del proyecto con P/C y semáforo, propuestas de arquitectura de producción, métrica de éxito y costos. | El método replicable. |
| 21–22-oct | Bot v2 por **SDD**: constitución de 18 principios, examen de 30 conversaciones validado por la SDR, intérprete IA con ficha JSON fija. Línea base sin IA: servicio 90 %, BANT exacto 69 %. Plan del paso a producción en AWS con Microsoft Authenticator. | Medir contra un examen con código. |

## Qué cambiaríamos al replicarlo

1. **Empezar por el cuestionario y el examen**, no por el código: con 30 conversaciones correctas
   validadas por el SDR desde el día uno se mide todo.
2. **Pedir las cuentas de la empresa la primera semana** (Meta con acceso total, HubSpot
   superadmin, Claude Platform, tarjeta). Lo que más demoró en Logisa fueron accesos y tokens.
3. **Token permanente y estado en disco desde el primer día.**
4. **La IA activa en pruebas desde el principio** (con tope de gasto bajo): probar sin IA y salir
   con IA hace que lo validado no sea lo que sale.
5. **Usar la plantilla de este repo** en vez de partir del código de un cliente.
