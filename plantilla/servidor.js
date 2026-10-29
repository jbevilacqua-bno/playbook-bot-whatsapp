/* Servidor del bot de WhatsApp (Node.js 18+, sin dependencias).
   Modos:
     node servidor.js               → WhatsApp de prueba: abre un túnel de cloudflared y registra el webhook en Meta solo.
     node servidor.js --simulador   → solo el simulador (http://localhost:PORT/simulador) y, si hay cloudflared, una liga con llave para probadores.
     node servidor.js --consola     → se escribe como cliente en esta ventana; sin red.
     node servidor.js --produccion  → sin túnel; escucha en 127.0.0.1 detrás de Nginx con HTTPS (ver docs/08-produccion.md).
   Las claves viven en %USERPROFILE%\.bot-cliente\.env (fuera del código y de Dropbox). */
"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto"), os = require("os");
const { spawn } = require("child_process");
const M = require("./motor.js"), IA = require("./ia.js"), HS = require("./hubspot.js");

const MODO = process.argv.includes("--consola") ? "consola" : process.argv.includes("--simulador") ? "simulador"
  : process.argv.includes("--produccion") ? "produccion" : "whatsapp";
const AQUI = __dirname;
const CONF = process.env.BOT_CONFIG_DIR || path.join(os.homedir(), ".bot-cliente");
const REG = path.join(AQUI, "registros"), SES = path.join(AQUI, "sesiones");
[REG, SES].forEach(d => fs.mkdirSync(d, { recursive: true }));

/* ---------------------------------------------------------------- configuración (se relee si cambia: pegar un token nuevo no exige reiniciar) */
let envCache = {}, envMtime = 0;
function cfg(k) {
  const f = path.join(CONF, ".env");
  try { const m = fs.statSync(f).mtimeMs; if (m !== envMtime) { envMtime = m; envCache = {};
    for (const l of fs.readFileSync(f, "utf8").split(/\r?\n/)) { const x = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/); if (x) envCache[x[1]] = x[2]; } } } catch (e) {}
  return envCache[k] !== undefined && envCache[k] !== "" ? envCache[k] : (process.env[k] || "");
}
const hora = () => new Date().toLocaleString("es-MX", { hour12: false });   // hora local: un log en UTC ya escondió un diagnóstico
const log = s => console.log(`[${hora()}] ${s}`);
const costo = o => fs.appendFileSync(path.join(REG, "costos.jsonl"), JSON.stringify({ t: new Date().toISOString(), ...o }) + "\n");

/* ---------------------------------------------------------------- sesiones en disco (un reinicio no corta las conversaciones) */
const archivoSesion = id => path.join(SES, String(id).replace(/[^\w-]/g, "_") + ".json");
function leerSesion(id) {
  try { const s = JSON.parse(fs.readFileSync(archivoSesion(id), "utf8"));
    s.servicio = s.servicio ? M.CONFIG.servicios.find(x => x.id === s.servicio.id) || null : null; return s; }
  catch (e) { return Object.assign(M.crearSesion(), { id, creada: Date.now() }); }
}
const guardarSesion = s => fs.writeFileSync(archivoSesion(s.id), JSON.stringify(s, null, 1));

/* Un mensaje del cliente → interpretar (IA opcional) → motor → respuestas. Mismo camino para los tres canales. */
async function atender(id, texto, canal) {
  const S = leerSesion(id); S.canal = canal; S.ultimoCliente = Date.now(); S.recordado = false;
  let ia = null;
  if (texto && !/^\/?reset$/i.test(texto.trim()) && cfg("USAR_IA") !== "0")
    ia = await IA.interpretar({ texto, pendiente: M.pendienteDe(S), sabemos: S.datos }, cfg, costo);
  const mensajes = M.turno(S, texto, ia);
  guardarSesion(S); programarCRM(S);
  return { mensajes, ficha: M.ficha(S), ia };
}

/* HubSpot 90 s después del último mensaje (por si la persona agrega algo) */
const timers = {};
function programarCRM(S) {
  clearTimeout(timers[S.id]);
  if (!S.datos.correo) return;
  timers[S.id] = setTimeout(async () => {
    const s = leerSesion(S.id), f = { ...M.ficha(s), telefono: s.canal === "whatsapp" ? "+" + s.id : "", ambiente: cfg("AMBIENTE"), notaId: s.notaId };
    try { const r = await HS.enviar(f, s.historial, cfg, log, REG); if (r) { s.notaId = r.notaId; guardarSesion(s); } }
    catch (e) { log("✗ HubSpot: " + e.message + (e.status === 401 ? " (token inválido)" : e.status === 403 ? " (falta un permiso)" : "")); }
  }, MODO === "consola" ? 1000 : 90000);
}

/* ---------------------------------------------------------------- WhatsApp: envío */
const GRAPH = () => "https://graph.facebook.com/" + (cfg("GRAPH_VERSION") || "v22.0");
async function graph(ruta, cuerpo, token) {
  const r = await fetch(GRAPH() + ruta, { method: "POST", headers: { authorization: "Bearer " + (token || cfg("WHATSAPP_TOKEN")), "content-type": "application/json" }, body: JSON.stringify(cuerpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error((j.error && j.error.message) || "HTTP " + r.status); e.codigo = j.error && j.error.code; throw e; }
  return j;
}
/* WhatsApp entrega 521… (MX) / 549… (AR) y la lista de prueba de Meta los guarda sin ese dígito (error 131030). */
const formaQueFunciono = {};
function variantes(tel) { const v = [tel]; if (/^521\d{10}$/.test(tel)) v.push("52" + tel.slice(3)); if (/^549\d{10}$/.test(tel)) v.push("54" + tel.slice(3)); return v; }
async function mandar(tel, cuerpo) {
  let ultimo; const formas = formaQueFunciono[tel] ? [formaQueFunciono[tel]] : variantes(tel);
  for (const to of formas) {
    try { await graph("/" + cfg("WHATSAPP_PHONE_NUMBER_ID") + "/messages", { messaging_product: "whatsapp", to, ...cuerpo }); formaQueFunciono[tel] = to; costo({ tipo: "envio" }); return; }
    catch (e) { ultimo = e; if (e.codigo !== 131030) break; }
  }
  throw ultimo;
}
const corto = (t, n) => t.length > n ? t.slice(0, n - 1) + "…" : t;
/* Límites de Meta: cuerpo interactivo ≤1.024, botón ≤20, fila ≤24, ≤3 botones, ≤10 filas. El bot nunca se queda mudo. */
async function enviarWA(tel, m) {
  try {
    if (!m.opciones || !m.opciones.length) {
      for (let i = 0; i < m.texto.length; i += 4000) await mandar(tel, { type: "text", text: { body: m.texto.slice(i, i + 4000) } });
      return;
    }
    let cuerpo = m.texto;
    if (cuerpo.length > 1024) { await mandar(tel, { type: "text", text: { body: cuerpo } }); cuerpo = "Elige una opción o escribe tu respuesta:"; }
    const ops = m.opciones.slice(0, 10);
    const interactive = ops.length <= 3
      ? { type: "button", body: { text: cuerpo }, action: { buttons: ops.map(o => ({ type: "reply", reply: { id: o.id, title: corto(o.titulo, 20) } })) } }
      : { type: "list", body: { text: cuerpo }, action: { button: "Ver opciones", sections: [{ title: "Opciones", rows: ops.map(o => ({ id: o.id, title: corto(o.titulo, 24) })) }] } };
    await mandar(tel, { type: "interactive", interactive });
  } catch (e) {
    log("✗ No se pudo enviar a " + tel + ": " + e.message + (e.codigo === 131030 ? " (ese teléfono no está dado de alta en el número de prueba)" : e.codigo === 190 ? " (token vencido: use el token permanente)" : ""));
    if (m.opciones && !m._numerado) {   // reintento como texto numerado
      const txt = m.texto + "\n\n" + m.opciones.map((o, i) => `${i + 1}. ${o.titulo}`).join("\n");
      try { await mandar(tel, { type: "text", text: { body: txt.slice(0, 4000) } }); } catch (e2) {}
    }
  }
}

/* ---------------------------------------------------------------- WhatsApp: recepción */
function firmaValida(raw, firma) {
  const secreto = cfg("WHATSAPP_APP_SECRET"); if (!secreto || !firma) return false;
  const esperada = "sha256=" + crypto.createHmac("sha256", secreto).update(raw).digest("hex");
  return firma.length === esperada.length && crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperada));
}
const IDS = path.join(SES, "_ids.json");
let ids = []; try { ids = JSON.parse(fs.readFileSync(IDS, "utf8")); } catch (e) {}
function yaProcesado(id) { if (ids.includes(id)) return true; ids.push(id); ids = ids.slice(-1000); fs.writeFileSync(IDS, JSON.stringify(ids)); return false; }
const numeroElegido = {};   // si contesta "2" a un texto numerado
async function recibirWA(body) {
  for (const entry of body.entry || []) for (const ch of entry.changes || []) {
    const v = ch.value || {};
    for (const st of v.statuses || []) costo({ tipo: "estado", estado: st.status, cobrable: st.pricing && st.pricing.billable, categoria: st.pricing && st.pricing.category });
    for (const msg of v.messages || []) {
      if (yaProcesado(msg.id)) continue;   // Meta reintenta: nunca contestar dos veces el mismo mensaje
      const tel = msg.from;
      let texto = msg.type === "text" ? msg.text.body
        : msg.type === "interactive" ? (msg.interactive.button_reply || msg.interactive.list_reply || {}).id
        : msg.type === "button" ? msg.button.text : "";
      if (!texto) { await enviarWA(tel, { texto: "Por ahora solo puedo leer texto. ¿Me lo escribes, por favor?" }); continue; }
      if (/^\d{1,2}$/.test(texto.trim()) && numeroElegido[tel]) texto = numeroElegido[tel][+texto - 1] || texto;
      log("← " + tel + ": " + texto);
      const { mensajes } = await atender(tel, texto, "whatsapp");
      for (const m of mensajes) { if (m.opciones) numeroElegido[tel] = m.opciones.map(o => o.id); log("→ " + tel + ": " + m.texto.replace(/\n/g, " ")); await enviarWA(tel, m); }
    }
  }
}

/* Recordatorio a las 2 h (dentro de la ventana de 24 h de Meta) y «incompleta» a las 24 h */
if (require.main === module) setInterval(() => {
  if (MODO !== "whatsapp" && MODO !== "produccion") return;
  for (const f of fs.readdirSync(SES).filter(x => x.endsWith(".json") && x !== "_ids.json")) {
    const s = leerSesion(f.replace(/\.json$/, "")); if (s.canal !== "whatsapp" || s.cerrado || s.baja || !s.ultimoCliente) continue;
    const h = (Date.now() - s.ultimoCliente) / 3600000;
    if (h >= 2 && h < 23 && !s.recordado) { s.recordado = true; guardarSesion(s); enviarWA(s.id, { texto: "¿Seguimos? Cuando puedas, contesta la última pregunta y avanzamos." }); }
    if (h >= 24 && !s.incompleta) { s.incompleta = true; s.notas.push("Conversación incompleta"); guardarSesion(s); programarCRM(s); }
  }
}, 5 * 60000);

/* ---------------------------------------------------------------- servidor HTTP */
const LLAVE = crypto.randomBytes(9).toString("base64url");
const porLiga = req => !!req.headers["cf-connecting-ip"];
const PORT = MODO === "simulador" ? +(process.env.PORT || 8090) : +(cfg("PORT") || 8088);
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  const json = (o, c = 200) => { res.writeHead(c, { "content-type": "application/json; charset=utf-8" }); res.end(JSON.stringify(o)); };
  // verificación del webhook (Meta)
  if (req.method === "GET" && url.pathname === "/webhook") {
    const ok = url.searchParams.get("hub.mode") === "subscribe" && url.searchParams.get("hub.verify_token") === cfg("WHATSAPP_VERIFY_TOKEN");
    if (ok) log("✓ Meta verificó el webhook");
    res.writeHead(ok ? 200 : 403); return res.end(ok ? url.searchParams.get("hub.challenge") : "");
  }
  if (req.method === "POST" && url.pathname === "/webhook") {
    const chunks = []; req.on("data", c => chunks.push(c)); req.on("end", () => {
      const raw = Buffer.concat(chunks);
      if (!firmaValida(raw, req.headers["x-hub-signature-256"])) { log("✗ Mensaje con firma inválida: descartado"); res.writeHead(401); return res.end(); }
      res.writeHead(200); res.end();   // contestar rápido a Meta; procesar después
      try { recibirWA(JSON.parse(raw.toString("utf8"))).catch(e => log("✗ " + e.message)); } catch (e) { log("✗ JSON inválido"); }
    }); return;
  }
  if (req.method === "GET" && url.pathname === "/estado") {
    if (porLiga(req) && MODO === "produccion") { res.writeHead(404); return res.end(); }
    return json({ en_linea: true, modo: MODO, hubspot: cfg("HUBSPOT_MODO") || "simular", ia: cfg("ANTHROPIC_API_KEY") ? cfg("MODELO_IA") || "claude-sonnet-5-5" : "apagada",
      conversaciones: fs.readdirSync(SES).filter(x => x.endsWith(".json")).length - (fs.existsSync(IDS) ? 1 : 0) });
  }
  if (req.method === "GET" && url.pathname === "/costos") {
    if (porLiga(req)) { res.writeHead(404); return res.end(); }
    let n = { envios: 0, ia: 0, tokens_entrada: 0, tokens_salida: 0, fallas_ia: 0 };
    try { for (const l of fs.readFileSync(path.join(REG, "costos.jsonl"), "utf8").split("\n").filter(Boolean)) { const o = JSON.parse(l);
      if (o.tipo === "envio") n.envios++; if (o.tipo === "ia") { n.ia++; n.tokens_entrada += o.entrada || 0; n.tokens_salida += o.salida || 0; } if (o.tipo === "ia_falla") n.fallas_ia++; } } catch (e) {}
    return json(n);
  }
  // simulador (en esta compu sin llave; por la liga, solo con la llave)
  if (url.pathname === "/simulador" || url.pathname === "/api/simular") {
    if (MODO === "produccion") { res.writeHead(404); return res.end(); }
    if (porLiga(req) && url.searchParams.get("llave") !== LLAVE) { res.writeHead(403, { "content-type": "text/plain; charset=utf-8" }); return res.end("Esta liga no es válida o ya cambió. Pide la liga nueva del simulador."); }
    if (req.method === "GET") { res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); return res.end(fs.readFileSync(path.join(AQUI, "simulador.html"))); }
    const chunks = []; req.on("data", c => chunks.push(c)); req.on("end", async () => {
      try { const b = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        if (b.nueva) { try { fs.unlinkSync(archivoSesion("sim-" + b.id)); } catch (e) {} }
        const r = await atender("sim-" + b.id, b.texto, "simulador");
        guardarTexto("sim-" + b.id); json({ ...r, ia_activa: !!cfg("ANTHROPIC_API_KEY") });
      } catch (e) { json({ error: e.message }, 500); }
    }); return;
  }
  res.writeHead(404); res.end();
});

/* Conversación en texto (una por sesión) para revisar y comentar. En Logisa se guarda además un Word con la ficha. */
function guardarTexto(id) {
  const s = leerSesion(id), dir = path.join(AQUI, "conversaciones"); fs.mkdirSync(dir, { recursive: true });
  const f = M.ficha(s);
  fs.writeFileSync(path.join(dir, id + ".txt"), s.historial.map(m => (m.de === "bot" ? "BOT: " : "CLIENTE: ") + m.texto).join("\n") +
    "\n\n--- Ficha para el SDR ---\n" + JSON.stringify(f, null, 2));
}

/* ---------------------------------------------------------------- túnel (cloudflared) y registro del webhook en Meta */
function abrirTunel() {
  return new Promise((ok, mal) => {
    let p; try { p = spawn(cfg("CLOUDFLARED_EXE") || "cloudflared", ["tunnel", "--no-autoupdate", "--url", "http://localhost:" + PORT], { stdio: ["ignore", "pipe", "pipe"] }); } catch (e) { return mal(e); }
    let listo = false; const t = setTimeout(() => !listo && mal(new Error("el túnel no dio dirección en 60 s")), 60000);
    const leer = d => { const m = String(d).match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/); if (m && !listo) { listo = true; clearTimeout(t); ok(m[0]); } };
    p.stdout.on("data", leer); p.stderr.on("data", leer);
    p.on("error", e => { if (!listo) { clearTimeout(t); mal(e); } });
    p.on("exit", c => { if (!listo) { clearTimeout(t); mal(new Error("cloudflared terminó (código " + c + ")")); } else log("✗ El túnel se cerró. Vuelva a abrir la ventana."); });
    process.on("exit", () => { try { p.kill(); } catch (e) {} });
  });
}
async function registrarWebhook(base) {
  const qs = new URLSearchParams({ object: "whatsapp_business_account", callback_url: base + "/webhook", verify_token: cfg("WHATSAPP_VERIFY_TOKEN"),
    fields: "messages", include_values: "true", access_token: cfg("WHATSAPP_APP_ID") + "|" + cfg("WHATSAPP_APP_SECRET") });
  const r = await fetch(GRAPH() + "/" + cfg("WHATSAPP_APP_ID") + "/subscriptions", { method: "POST", body: qs });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.success) throw new Error((j.error && j.error.message) || "HTTP " + r.status);
  try { await graph("/" + cfg("WHATSAPP_WABA_ID") + "/subscribed_apps", {}); } catch (e) { log("Aviso: no se confirmó la suscripción de la cuenta de WhatsApp a la app (" + e.message + ")."); }
}

/* ---------------------------------------------------------------- arranque */
async function consola() {
  const rl = require("readline").createInterface({ input: process.stdin, output: process.stdout });
  console.log(`\n=== Prueba en consola (sin WhatsApp) · HubSpot: ${cfg("HUBSPOT_MODO") || "simular"} · IA: ${cfg("ANTHROPIC_API_KEY") ? "activa" : "apagada"} ===\nEscriba como el cliente. /reset reinicia; /salir termina.\n`);
  const id = "consola-" + Date.now();
  const preguntar = () => rl.question("CLIENTE > ", async t => {
    if (t.trim() === "/salir") { rl.close(); setTimeout(() => process.exit(0), 1500); return; }
    const { mensajes, ficha } = await atender(id, t, "consola");
    for (const m of mensajes) console.log("BOT     > " + m.texto + (m.opciones ? "\n          [" + m.opciones.map(o => o.titulo).join("] [") + "]" : ""));
    if (ficha.cerrada) console.log("          (calificación " + ficha.calificacion + " · " + ficha.bant + ")");
    preguntar();
  });
  preguntar();
}

if (require.main !== module) { /* usado desde probar.js: no arranca nada */ }
else if (MODO === "consola") consola();
else server.listen(PORT, MODO === "produccion" ? "127.0.0.1" : undefined, async () => {
  console.log(`\nServidor en http://localhost:${PORT} · modo ${MODO} · HubSpot: ${(cfg("HUBSPOT_MODO") || "simular").toUpperCase()} · IA: ${cfg("ANTHROPIC_API_KEY") ? "activa (" + (cfg("MODELO_IA") || "claude-sonnet-5-5") + ")" : "apagada"}`);
  if (MODO === "simulador") {
    console.log("Simulador en esta compu: http://localhost:" + PORT + "/simulador");
    try { const u = await abrirTunel(); console.log("Liga para probadores (cambia en cada arranque): " + u + "/simulador?llave=" + LLAVE); }
    catch (e) { console.log("Liga para probadores: no disponible (" + e.message + "). El simulador sigue funcionando en esta compu."); }
  }
  if (MODO === "whatsapp") {
    const faltan = ["WHATSAPP_TOKEN", "WHATSAPP_APP_SECRET", "WHATSAPP_APP_ID", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_WABA_ID", "WHATSAPP_VERIFY_TOKEN"].filter(k => !cfg(k) || cfg(k) === "PEGAR_AQUI");
    if (faltan.length) { log("✗ Faltan datos en la configuración: " + faltan.join(", ")); return; }
    try { const u = await abrirTunel(); log("✓ Túnel abierto: " + u);
      try { await registrarWebhook(u); log("✓ Webhook registrado en Meta\n\n  ✓ LISTO. Deje esta ventana abierta.\n"); }
      catch (e) { log("✗ No se pudo registrar el webhook solo (" + e.message + ").\n  Péguelo a mano en Meta › WhatsApp › Configuración › Webhook:\n  URL: " + u + "/webhook\n  Token de verificación: " + cfg("WHATSAPP_VERIFY_TOKEN") + "\n  y suscriba el campo «messages»."); }
    } catch (e) { log("✗ No se pudo abrir el túnel: " + e.message); }
  }
});

module.exports = { firmaValida, variantes };
