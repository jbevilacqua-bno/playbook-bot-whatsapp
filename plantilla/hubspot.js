/* HubSpot: crea o actualiza el contacto por correo y mantiene UNA nota por conversación.
   HUBSPOT_MODO=simular → no toca HubSpot: guarda en registros/hubspot/ lo que mandaría.
   HUBSPOT_MODO=real    → usa HUBSPOT_TOKEN (clave de servicio con permisos de contactos).
   Reglas: no se pisan nombre, empresa ni teléfono que ya tienen valor; lo que no existe en el portal se deja
   fuera y se avisa (si no, HubSpot rechaza la escritura entera). Ajustar PROPIEDADES al portal del cliente. */
"use strict";
const fs = require("fs"), path = require("path");
const API = "https://api.hubapi.com";

// propiedad de HubSpot → cómo se obtiene de la ficha. Crear antes las propias en un grupo del bot.
const PROPIEDADES = {
  email: f => f.correo,
  firstname: f => f.nombre,
  company: f => f.empresa,
  phone: f => f.telefono,
  calificacion_bot: f => String(f.calificacion),
  bant_bot: f => f.bant,
  servicio_bot: f => f.servicio,
  origen_bot: f => f.ambiente === "produccion" ? "Produccion" : "Pruebas"
};
const NO_PISAR = ["firstname", "company", "phone"];

async function hs(cfg, metodo, ruta, cuerpo) {
  const r = await fetch(API + ruta, { method: metodo, headers: { authorization: "Bearer " + cfg("HUBSPOT_TOKEN"), "content-type": "application/json" },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(r.status + " " + (j.message || "")); e.status = r.status; throw e; }
  return j;
}
let existentes = null;
async function propiedadesDelPortal(cfg) {
  if (!existentes) existentes = new Set((await hs(cfg, "GET", "/crm/v3/properties/contacts")).results.map(p => p.name));
  return existentes;
}

async function enviar(f, conversacion, cfg, log, carpetaRegistros) {
  const props = {};
  for (const [k, fn] of Object.entries(PROPIEDADES)) { const v = fn(f); if (v != null && v !== "") props[k] = v; }
  if (!props.email) { log("HubSpot: sin correo, no se envía"); return; }
  const nota = conversacion.map(m => (m.de === "bot" ? "Bot: " : "Cliente: ") + m.texto).join("\n");

  if (String(cfg("HUBSPOT_MODO")).toLowerCase() !== "real") {
    const dir = path.join(carpetaRegistros, "hubspot"); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, props.email.replace(/[^\w.@-]/g, "_") + ".json"), JSON.stringify({ props, nota }, null, 2));
    log("HubSpot (simular): guardado lo que se mandaría para " + props.email); return;
  }
  const portal = await propiedadesDelPortal(cfg);
  const fuera = Object.keys(props).filter(k => !portal.has(k)); fuera.forEach(k => delete props[k]);
  if (fuera.length) log("HubSpot: se dejaron fuera (créelas en el portal): " + fuera.join(", "));

  const busca = await hs(cfg, "POST", "/crm/v3/objects/contacts/search", { filterGroups: [{ filters: [{ propertyName: "email", operator: "EQ", value: props.email }] }], properties: NO_PISAR, limit: 1 });
  let id;
  if (busca.results && busca.results.length) {
    const actual = busca.results[0]; id = actual.id;
    NO_PISAR.forEach(k => { if (actual.properties[k]) delete props[k]; });
    await hs(cfg, "PATCH", "/crm/v3/objects/contacts/" + id, { properties: props });
    log("HubSpot: contacto " + id + " actualizado");
  } else {
    id = (await hs(cfg, "POST", "/crm/v3/objects/contacts", { properties: props })).id;
    log("HubSpot: contacto " + id + " creado");
  }
  // una sola nota por conversación: si ya hay una, se actualiza
  const cuerpo = { properties: { hs_timestamp: new Date().toISOString(), hs_note_body: nota.replace(/\n/g, "<br>") } };
  if (f.notaId) { await hs(cfg, "PATCH", "/crm/v3/objects/notes/" + f.notaId, cuerpo); return { contactoId: id, notaId: f.notaId }; }
  cuerpo.associations = [{ to: { id }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] }];
  const n = await hs(cfg, "POST", "/crm/v3/objects/notes", cuerpo);
  log("HubSpot: nota con la conversación agregada");
  return { contactoId: id, notaId: n.id };
}

module.exports = { enviar };
