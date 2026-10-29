# Checklist · Bot de WhatsApp para una cuenta nueva

Copiar este archivo al control del cliente y marcar cada punto con quién autorizó y quién ejecutó.

## A · Arranque (semana 1)

- [ ] Cuestionario de arranque contestado (13 temas) — [doc 1](../docs/01-arranque-con-el-cliente.md)
- [ ] Quién tiene la cuenta de WhatsApp Business del número y si se libera
- [ ] Administrador del portafolio de Meta con Facebook registrado como desarrollador
- [ ] Superadministrador de HubSpot disponible para crear la clave
- [ ] Tarjeta de la empresa para Meta y Claude Platform
- [ ] 20–30 conversaciones reales para casos de prueba
- [ ] Correcciones históricas del cliente (proveedor anterior) juntadas con su origen
- [ ] Aviso de privacidad y plazo de guarda definidos
- [ ] Carpeta compartida del proyecto (Dropbox/Drive) creada; claves fuera de ella

## B · Lógica y pruebas

- [ ] Copiar `plantilla/` a la carpeta del cliente y renombrar `.bot-cliente`
- [ ] Servicios, preguntas, bases y textos dictados cargados en el motor — [doc 2](../docs/02-construir-la-logica.md)
- [ ] Reglas numeradas y aprobadas
- [ ] Simulador: una conversación por servicio sin errores — [doc 3](../docs/03-simulador-y-pruebas.md)
- [ ] Banco de pruebas base BP-01 a BP-24 en verde (sin IA)
- [ ] Recorrido de todas las opciones contra los límites de Meta
- [ ] Guardián de frases vetadas en verde
- [ ] Examen de 30 conversaciones validado por el SDR

## C · Integraciones (ambiente de pruebas)

- [ ] HubSpot: clave con permisos mínimos, propiedades creadas y verificadas por API, prueba con el simulador — [doc 4](../docs/04-conectar-hubspot.md)
- [ ] Workflows revisados (disparo por el bot, contactos de prueba, calificación final)
- [ ] Página de reuniones con regreso a WhatsApp
- [ ] Claude Platform: cuenta de la empresa, tope de gasto, workspace de pruebas, llave — [doc 5](../docs/05-conectar-ia-claude.md)
- [ ] App de Meta con el caso de uso de WhatsApp en el portafolio del cliente — [doc 6](../docs/06-meta-app-y-numero-de-prueba.md)
- [ ] 5 teléfonos de prueba autorizados
- [ ] Usuario del sistema y **token permanente**
- [ ] `INICIAR-BOT` dice LISTO, webhook registrado, contesta desde el celular — [doc 7](../docs/07-servidor-de-prueba-con-tunel.md)
- [ ] Liga del simulador para probadores funcionando

## D · Validación

- [ ] Corrida completa con IA sin errores graves
- [ ] Probadores del cliente: comentarios en el Word revisados y cerrados
- [ ] Una semana de pruebas en WhatsApp con `costos.jsonl`
- [ ] Costos rehechos con datos reales y aprobados por dirección — [doc 9](../docs/09-costos.md)
- [ ] **Liberación del ambiente firmada** (fecha, respaldo del código, versión del control)

## E · Producción — [doc 8](../docs/08-produccion.md)

- [ ] Cuentas de producción a nombre de la empresa (servidor, Claude, token Meta, clave HubSpot)
- [ ] Servidor: IP fija, firewall 80/443, actualizaciones, subdominio, Nginx + Let's Encrypt
- [ ] Usuario del servicio sin admin, versiones por carpeta, claves fuera del código
- [ ] Arranque automático, estado en disco, vuelta a la versión anterior probada
- [ ] Vigilante externo y respaldos con restauración de prueba
- [ ] Número definitivo dado de alta, nombre visible aprobado, negocio verificado
- [ ] Método de pago en la cuenta de WhatsApp
- [ ] Plantillas aprobadas para fuera de las 24 h
- [ ] App en modo Activo
- [ ] `.env` con el Phone number ID definitivo y webhook a `https://bot.cliente.com/webhook`
- [ ] Prueba final con números internos, una por servicio
- [ ] Túnel de pruebas apagado
- [ ] Número publicado (web, anuncios)
- [ ] Revisión de la primera semana (conversaciones, calificaciones con el SDR, costos)
