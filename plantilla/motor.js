/* Motor del bot: TODA la lógica de la conversación, sin red ni pantalla.
   Lo usan igual el simulador, la consola y WhatsApp (una sola implementación).
   Para un cliente nuevo se edita CONFIG; el resto se reutiliza.
   Principio: la IA entiende, el código decide. Si llega `ia` (ficha JSON del intérprete) se usa
   su texto_claro y sus datos; si no, contestan las reglas. */
"use strict";

/* ===================================================================== CONFIG DEL CLIENTE */
const CONFIG = {
  empresa: "Empresa Ejemplo",
  enlaceReunion: "https://meetings.hubspot.com/tu-vendedor",
  correoProveedores: "contacto@empresa-ejemplo.com",
  servicios: [
    // id interno · etiqueta del botón (≤20 caracteres) · palabras que lo identifican · preguntas técnicas (1 a 5, en orden)
    { id: "proyecto", etiqueta: "Proyecto nuevo", claves: ["proyecto", "construir", "instalar", "instalacion", "obra", "nuevo"],
      preguntas: ["¿Qué necesitas construir o instalar, y en qué ciudad?"] },
    { id: "mantenimiento", etiqueta: "Mantenimiento", claves: ["mantenimiento", "poliza", "preventivo", "correctivo", "falla", "revision"],
      preguntas: ["¿Qué equipos necesitas mantener y cuántos son?"] },
    { id: "otro", etiqueta: "Otra consulta", claves: [], preguntas: ["Cuéntame brevemente qué necesitas."] }
  ],
  // Bases autorizadas: lo único que el bot contesta. Lo demás va a la reunión.
  bases: [
    { codigo: "B-01", claves: ["cobertura", "ciudades", "donde trabajan", "todo el pais"], respuesta: "Trabajamos en todo el país." },
    { codigo: "B-02", claves: ["horario", "a que hora", "atienden"], respuesta: "Nuestro equipo atiende de lunes a viernes de 9:00 a 18:00." }
  ],
  textos: {
    saludo: "Hola, gracias por escribir a {empresa}. ¿En qué te podemos apoyar?",
    privacidad: "Tus datos se usan solo para dar seguimiento a tu solicitud, según nuestro aviso de privacidad.",
    presupuesto: ["¿El presupuesto para este proyecto ya está aprobado, en evaluación o todavía no lo tienen?", "Para orientarte mejor: ¿ya cuentan con presupuesto aprobado para esto?"],
    participacion: ["¿Cuál es tu participación en la decisión: decides, participas en la evaluación o lo decide otra persona?", "¿Tú tomas la decisión o la toma otra persona de tu empresa?"],
    fecha: ["¿Para cuándo quieren iniciar?", "¿En cuántos meses les gustaría arrancar?"],
    nombre: ["¿Me compartes tu nombre y el de tu empresa?", "Para registrarte, ¿cuál es tu nombre y tu empresa?"],
    correo: ["¿A qué correo de tu empresa te podemos escribir?", "¿Me compartes un correo para darte seguimiento?"],
    correoEmpresa: "¿Tienes un correo de tu empresa? Así lo registramos con el equipo.",
    precio: "El costo depende del alcance de cada proyecto, por lo que no manejamos precios por este medio.",
    duda: "Esa consulta la revisamos contigo en la reunión de seguimiento con nuestro equipo; ya quedó anotada.",
    dudas: "Tus dudas ya quedaron anotadas para la reunión con nuestro equipo.",
    retomando: "Retomando tu proyecto: ",
    bot: "Te atiende el asistente virtual de {empresa}.",
    baja: "Entendido, no te volveremos a escribir. Gracias por tu tiempo.",
    proveedor: "Gracias por tu interés. Para propuestas de proveedores escríbenos a {proveedores}.",
    persona: "Con gusto, una persona de nuestro equipo te contactará.",
    cierreAlto: "Gracias, {nombre}. El siguiente paso es una reunión con nuestro equipo; puedes agendarla aquí: {enlace}",
    cierreMedio: "Gracias, {nombre}. Nuestro equipo te escribirá para dar seguimiento.",
    cierreBajo: "Gracias, {nombre}. Quedamos a tus órdenes.",
    despedidaCorta: "Con gusto. Quedamos a tus órdenes."
  }
};

/* ===================================================================== utilidades */
const nz = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
const llenar = (t, S) => t.replace("{empresa}", CONFIG.empresa).replace("{proveedores}", CONFIG.correoProveedores)
  .replace("{enlace}", CONFIG.enlaceReunion).replace("{nombre}", (S && S.datos.nombre ? S.datos.nombre.split(" ")[0] : "").trim() || "");
const PERSONALES = /@(gmail|hotmail|outlook|yahoo|live|icloud|prodigy)\./i;

/* Error de dedo: una letra de diferencia o dos letras volteadas, solo palabras de 6+ letras. */
function casi(a, b) {
  if (a === b) return true; if (b.length < 6 || Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) { const d = [...a].map((c, i) => c !== b[i] ? i : -1).filter(i => i >= 0);
    return d.length === 1 || (d.length === 2 && d[1] === d[0] + 1 && a[d[0]] === b[d[1]] && a[d[1]] === b[d[0]]); }
  const [c, l] = a.length < b.length ? [a, b] : [b, a]; let i = 0, j = 0, s = 0;
  while (i < c.length && j < l.length) { if (c[i] === l[j]) { i++; j++; } else { if (++s > 1) return false; j++; } } return true;
}
const corregir = t => t.split(" ").map(w => ["aprobado", "evaluacion", "presupuesto", "decido", "mantenimiento"].find(k => casi(w, k)) || w).join(" ");

/* ===================================================================== cosecha: cualquier mensaje contesta cualquier dato */
function extraer(texto) {
  const t = corregir(nz(texto)), d = {};
  const correo = String(texto).replace(/\s+arroba\s+/gi, "@").replace(/\s+punto\s+/gi, ".").match(/[\w.+-]+@[\w-]+(\.[\w-]+)+/);
  if (correo) d.correo = correo[0].toLowerCase();
  if (/(no hay|sin|no tenemos|todavia no) (presupuesto|tenemos presupuesto)|no lo tenemos/.test(t)) d.presupuesto = "no_hay";
  else if (/\b(aprobado|autorizado|ya esta aprobado)\b/.test(t)) d.presupuesto = "aprobado";
  else if (/\b(evaluacion|evaluando|aprobacion|armando|cotizando)\b/.test(t)) d.presupuesto = "evaluacion";
  if (/\b(yo decido|decido yo|soy quien decide|yo autorizo|yo apruebo|soy el dueno|soy la duena)\b/.test(t)) d.participacion = "decide";
  else if (/\b(participo|evaluo|recomiendo|defino la parte|con mi equipo)\b/.test(t)) d.participacion = "participa";
  else if (/\b(decide (mi|el|la)|lo decide|mi jefe|mi director)\b/.test(t)) d.participacion = "menor";
  else if (/\b(solo (estoy )?investigando|solo cotizo|por curiosidad)\b/.test(t)) d.participacion = "investiga";
  const meses = t.match(/\b(\d{1,2}) mes(es)?\b/);
  if (meses) d.inicio_meses = +meses[1];
  else if (/\b(urgente|de inmediato|lo antes posible|cuanto antes|este mes)\b/.test(t)) d.inicio_meses = 1;
  else if (/\b(no (tenemos|hay) fecha|sin fecha|no se cuando|el proximo ano)\b/.test(t)) d.inicio_meses = "sin_fecha";
  if (/\b(planos|especificaciones|layout|inventario)\b/.test(t) && !/\bno (tengo|tenemos)\b/.test(t)) d.documentos = true;
  return d;
}
function intencion(texto) {
  const t = nz(texto);
  if (/^\/?(reset|reiniciar todo|empezar de cero)$/.test(t)) return "reset";
  if (/no (me|nos) (vuelvan|escriban|contacten|sigan)|denme de baja\b(?! (el|la|un|una))/.test(t)) return "baja";
  if (/(ofrecer(les)?|ofrecemos) (nuestros |nuestras )?(productos|servicios)|(somos|soy) (proveedor|distribuidor)/.test(t)) return "proveedor";
  if (/\b(eres|es) (un )?(bot|robot|persona real|humano)\b/.test(t)) return "bot";
  if (/(hablar con|me llame|llamenme|comunicarme con) (una persona|alguien|un asesor|asesor)/.test(t)) return "persona";
  if (/\b(cuanto cuesta|precio|costo|cotizacion|cuanto sale)\b/.test(t)) return "precio";
  if (/[¿?]/.test(String(texto))) return "duda";
  return "contesta";
}
function buscarBase(texto) { const t = nz(texto); return CONFIG.bases.find(b => b.claves.some(k => t.includes(nz(k)))); }
function buscarServicio(texto) { const t = corregir(nz(texto)).split(" ");
  return CONFIG.servicios.find(s => s.claves.some(k => t.some(w => casi(w, k) || w === k))); }

/* ===================================================================== calificación BANT 0–5 */
function calificar(S) {
  const d = S.datos; if (!S.servicio) return { nivel: 0, bant: null, cita: false };
  const B = { aprobado: 3, evaluacion: 2, no_hay: 1 }[d.presupuesto] ?? 1;
  const A = { decide: 3, participa: 2, menor: 1, investiga: 0 }[d.participacion] ?? 1;
  const N = d.documentos ? 3 : (S.respuestasServicio.length ? 2 : 1);
  const T = typeof d.inicio_meses === "number" ? (d.inicio_meses <= 3 ? 2 : d.inicio_meses <= 6 ? 1 : 0) : 0;
  const suma = B + A + N + T;
  let nivel = suma >= 11 ? 5 : suma >= 8 ? 4 : suma >= 5 ? 3 : suma >= 3 ? 2 : 1;
  const personal = d.correo && PERSONALES.test(d.correo);
  if (personal) nivel = Math.max(1, nivel - 1);
  if (!d.nombre) nivel = Math.min(nivel, 2);
  const cita = nivel >= 4 && A >= 2 && B >= 2 && N >= 2 && !!d.correo && !personal;
  return { nivel, bant: `B${B} A${A} N${N} T${T}`, cita };
}

/* ===================================================================== flujo */
const ORDEN = ["servicio", "tecnica", "presupuesto", "participacion", "fecha", "nombre", "correo"];
function crearSesion() {
  return { paso: "inicio", servicio: null, indicePregunta: 0, respuestasServicio: [], datos: {}, intentos: {},
    dudas: 0, notas: [], cerrado: false, despedido: false, baja: false, historial: [] };
}
function falta(S, p) {
  const d = S.datos;
  return ({ servicio: !S.servicio, tecnica: S.servicio && S.indicePregunta < S.servicio.preguntas.length,
    presupuesto: !d.presupuesto, participacion: !d.participacion, fecha: d.inicio_meses === undefined,
    nombre: !d.nombre && !S.intentos.nombreAgotado, correo: !d.correo && !S.intentos.correoAgotado })[p];
}
function textoDe(S, p, alt) {
  if (p === "servicio") return { texto: llenar(CONFIG.textos.saludo, S), opciones: CONFIG.servicios.map(s => ({ id: s.id, titulo: s.etiqueta })) };
  if (p === "tecnica") return { texto: S.servicio.preguntas[S.indicePregunta] };
  const v = CONFIG.textos[p]; return { texto: Array.isArray(v) ? v[alt ? 1 : 0] : v };
}
function siguiente(S) { return ORDEN.find(p => falta(S, p)); }

/* Un turno: recibe el texto (o el id de un botón) y devuelve los mensajes a mandar. */
function turno(S, entrada, ia) {
  const out = [], decir = (texto, opciones) => out.push(opciones ? { texto, opciones } : { texto });
  const original = String(entrada || "").trim();
  S.historial.push({ de: "cliente", texto: original });
  let texto = ia && ia.texto_claro ? ia.texto_claro : original;
  const intent = (ia && { pide_persona: "persona", se_va: "baja", es_bot: "bot", duda: "duda" }[ia.intencion]) || intencion(original);

  if (intent === "reset") { Object.assign(S, crearSesion()); S.paso = "servicio"; const q = textoDe(S, "servicio"); decir(q.texto, q.opciones); return fin(S, out); }
  if (S.baja) return fin(S, out);
  if (intent === "baja") { S.baja = true; S.notas.push("Pidió no ser contactado"); decir(CONFIG.textos.baja); return fin(S, out); }
  if (intent === "proveedor") { S.notas.push("Proveedor"); S.cerrado = true; decir(llenar(CONFIG.textos.proveedor, S)); return fin(S, out); }
  if (S.cerrado) {
    const d = extraer(texto); if (d.correo) { S.datos.correo = d.correo; decir("Gracias, actualizamos tu correo."); cerrar(S, decir, true); return fin(S, out); }
    decir(CONFIG.textos.despedidaCorta); return fin(S, out);
  }
  if (S.paso === "inicio") { S.paso = "servicio"; const q = textoDe(S, "servicio");
    const s0 = buscarServicio(texto) || CONFIG.servicios.find(s => s.id === original);
    if (!s0) { decir(q.texto, q.opciones); return fin(S, out); } }

  // 1) servicio por botón o por palabras
  if (!S.servicio) { const s = CONFIG.servicios.find(x => x.id === original) || buscarServicio(texto); if (s) S.servicio = s; }
  // 2) cosecha de todos los datos del mensaje (y de la ficha de la IA)
  const d = extraer(texto);
  if (ia) for (const k of ["presupuesto", "participacion", "inicio_meses", "documentos", "correo", "nombre", "empresa"]) if (ia[k] != null && ia[k] !== "") d[k] = ia[k];
  const pendiente = S.paso;
  if (pendiente === "nombre" && !d.nombre && !d.correo && intent === "contesta" && pareceNombre(original)) {
    const partes = original.split(/,|\s+de\s+|\s+y mi empresa es\s+/i).map(x => x.trim()).filter(Boolean);
    d.nombre = partes[0]; if (partes[1]) d.empresa = partes.slice(1).join(" "); }
  if (pendiente === "tecnica" && intent === "contesta" && original && !CONFIG.servicios.some(s => s.id === original)) { S.respuestasServicio.push(original); S.indicePregunta++; }
  const contestoPendiente = (pendiente === "servicio" && S.servicio) || pendiente === "tecnica" && S.respuestasServicio.length ||
    ({ presupuesto: "presupuesto", participacion: "participacion", fecha: "inicio_meses", nombre: "nombre", correo: "correo" }[pendiente] in d);
  for (const k in d) if (S.datos[k] === undefined || k === "correo") S.datos[k] = d[k];
  if (d.correo && PERSONALES.test(d.correo) && !S.intentos.correoEmpresa) { S.intentos.correoEmpresa = true; decir(CONFIG.textos.correoEmpresa); S.paso = "correo"; return fin(S, out); }

  // 3) intenciones que no cortan el flujo: contestan y retoman
  let retomar = false;
  if (intent === "bot") { decir(llenar(CONFIG.textos.bot, S)); retomar = true; }
  else if (intent === "persona") { S.notas.push("Pidió hablar con una persona"); decir(CONFIG.textos.persona); retomar = true; }
  else if (intent === "precio") { decir(CONFIG.textos.precio); retomar = true; }
  else if (intent === "duda") { const b = buscarBase(original);
    if (b) decir(b.respuesta); else { S.dudas++; S.notas.push("Duda: " + original); decir(S.dudas > 1 ? CONFIG.textos.dudas : CONFIG.textos.duda); } retomar = true; }

  // 4) regla B: si no contestó la pendiente, se repite UNA vez con otras palabras; después «No lo indicó»
  if (!retomar && pendiente !== "servicio" && pendiente !== "inicio" && !contestoPendiente && falta(S, pendiente)) {
    if (!S.intentos[pendiente]) { S.intentos[pendiente] = 1; const q = textoDe(S, pendiente, true); decir(q.texto, q.opciones); return fin(S, out); }
    S.notas.push("No lo indicó: " + pendiente);
    if (pendiente === "presupuesto") S.datos.presupuesto = "no_hay";
    if (pendiente === "participacion") S.datos.participacion = "menor";
    if (pendiente === "fecha") S.datos.inicio_meses = "sin_fecha";
    if (pendiente === "nombre") S.intentos.nombreAgotado = true;
    if (pendiente === "correo") S.intentos.correoAgotado = true;
    if (pendiente === "tecnica") S.indicePregunta++;
  }

  // 5) siguiente pregunta (o cierre)
  const p = siguiente(S);
  if (!p) { cerrar(S, decir); return fin(S, out); }
  if (p === "nombre" && !S.intentos.privacidad) { S.intentos.privacidad = true; decir(CONFIG.textos.privacidad); }
  const q = textoDe(S, p, retomar && p === pendiente);
  S.paso = p; decir((retomar && p === pendiente ? CONFIG.textos.retomando : "") + q.texto, q.opciones);
  return fin(S, out);
}
function pareceNombre(t) { return t.split(/\s+/).length <= 8 && t.length <= 80 && !/[?¿¡@]/.test(t) && !/^(ok|si|no|hola|gracias)\b/i.test(nz(t)); }
function cerrar(S, decir, recalificar) {
  const c = calificar(S); S.cerrado = true; S.calificacion = c;
  if (recalificar && !c.cita) return;
  decir(llenar(c.cita ? CONFIG.textos.cierreAlto : c.nivel >= 2 ? CONFIG.textos.cierreMedio : CONFIG.textos.cierreBajo, S).replace(", .", "."));
}
function fin(S, out) { out.forEach(m => S.historial.push({ de: "bot", texto: m.texto })); return out; }

/* Ficha para el SDR / CRM */
function ficha(S) {
  const c = calificar(S);
  return { servicio: S.servicio ? S.servicio.etiqueta : null, respuestas: S.respuestasServicio, ...S.datos,
    calificacion: c.nivel, bant: c.bant, cita: c.cita, notas: S.notas, cerrada: S.cerrado, baja: S.baja };
}
const pendienteDe = S => S.paso;

module.exports = { CONFIG, crearSesion, turno, ficha, calificar, extraer, intencion, pendienteDe };
