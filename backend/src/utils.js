// Genera la clave única alfanumérica de mascota, ej: HU-4F2A (RS-06)
export function generarCodigoMascota() {
  const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos
  let codigo = "HU-";
  for (let i = 0; i < 4; i++) {
    codigo += caracteres[Math.floor(Math.random() * caracteres.length)];
  }
  return codigo;
}

const HORA_INICIO = 8; // 8:00 am
const HORA_FIN = 18; // 6:00 pm
const SLOT_MIN = 30;

// Genera los horarios disponibles de un día para un veterinario,
// descartando los que chocan con citas existentes (RNF-01)
export function generarSlots(fecha, citasDelDia) {
  const slots = [];
  const base = new Date(fecha + "T00:00:00");
  for (let h = HORA_INICIO; h < HORA_FIN; h++) {
    for (const m of [0, 30]) {
      const slot = new Date(base);
      slot.setHours(h, m, 0, 0);
      const fin = new Date(slot.getTime() + SLOT_MIN * 60000);
      const ocupado = citasDelDia.some((c) => {
        const cFin = new Date(new Date(c.fechaHora).getTime() + c.duracionMin * 60000);
        return new Date(c.fechaHora) < fin && slot < cFin;
      });
      const pasado = slot < new Date();
      slots.push({
        hora: slot.toTimeString().slice(0, 5),
        fechaHora: slot.toISOString(),
        disponible: !ocupado && !pasado,
      });
    }
  }
  return slots;
}
