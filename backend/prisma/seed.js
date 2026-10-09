import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando datos de demostración...");

  // Limpieza (solo para demo)
  await prisma.vacuna.deleteMany();
  await prisma.consulta.deleteMany();
  await prisma.cita.deleteMany();
  await prisma.alergia.deleteMany();
  await prisma.mascota.deleteMany();
  await prisma.propietario.deleteMany();
  await prisma.usuario.deleteMany();

  const hash = (p) => bcrypt.hashSync(p, 10);

  // Las contraseñas de las cuentas demo NO van en el código (el repo es público):
  // se leen de variables de entorno (ver .env.example)
  const passVet = process.env.SEED_PASS_VET;
  const passRecepcion = process.env.SEED_PASS_RECEPCION;
  const passCliente = process.env.SEED_PASS_CLIENTE;
  if (!passVet || !passRecepcion || !passCliente) {
    console.error("❌ Faltan SEED_PASS_VET, SEED_PASS_RECEPCION y/o SEED_PASS_CLIENTE en las variables de entorno (ver .env.example)");
    process.exit(1);
  }

  // ── Usuarios (equipo 7 😄) ──
  const vet1 = await prisma.usuario.create({
    data: {
      nombre: "Dra. Stephani Mosquera",
      email: "vet@huellitas.dev",
      password: hash(passVet),
      rol: "VETERINARIO",
    },
  });
  const vet2 = await prisma.usuario.create({
    data: {
      nombre: "Dr. Leonardo Sanguña",
      email: "vet2@huellitas.dev",
      password: hash(passVet),
      rol: "VETERINARIO",
    },
  });
  await prisma.usuario.create({
    data: {
      nombre: "Mario Montero",
      email: "recepcion@huellitas.dev",
      password: hash(passRecepcion),
      rol: "RECEPCIONISTA",
    },
  });

  // Cliente con cuenta del portal + propietario vinculado
  const cliente = await prisma.usuario.create({
    data: {
      nombre: "Diana Ortiz",
      email: "cliente@huellitas.dev",
      password: hash(passCliente),
      rol: "CLIENTE",
      propietario: {
        create: {
          nombre: "Diana Ortiz",
          telefono: "0991234567",
          email: "cliente@huellitas.dev",
          direccion: "Cdla. San Carlos, Milagro",
        },
      },
    },
    include: { propietario: true },
  });

  // Propietario sin cuenta (registrado en recepción)
  const prop2 = await prisma.propietario.create({
    data: {
      nombre: "Diego Vera",
      telefono: "0987654321",
      direccion: "Av. Jaime Roldós, Milagro",
    },
  });

  // ── Mascotas ──
  const luna = await prisma.mascota.create({
    data: {
      codigo: "HU-7K2P",
      nombre: "Luna",
      especie: "PERRO",
      raza: "Mestiza",
      edadAnios: 3,
      sexo: "H",
      color: "Café",
      propietarioId: cliente.propietario.id,
      alergias: {
        create: [
          { medicamento: "Penicilina", descripcion: "Reacción cutánea severa" },
        ],
      },
    },
  });
  const michi = await prisma.mascota.create({
    data: {
      codigo: "HU-3M9X",
      nombre: "Michi",
      especie: "GATO",
      raza: "Siamés",
      edadAnios: 2,
      sexo: "M",
      color: "Gris",
      propietarioId: cliente.propietario.id,
    },
  });
  const rocky = await prisma.mascota.create({
    data: {
      codigo: "HU-5R4T",
      nombre: "Rocky",
      especie: "PERRO",
      raza: "Pastor Alemán",
      edadAnios: 5,
      sexo: "M",
      color: "Negro con café",
      propietarioId: prop2.id,
      alergias: { create: [{ medicamento: "Ivermectina" }] },
    },
  });

  // ── Vacunas (con próxima dosis calculada) ──
  const diasAtras = (n) => new Date(Date.now() - n * 86400000);
  const diasAdelante = (n) => new Date(Date.now() + n * 86400000);

  await prisma.vacuna.create({
    data: {
      tipo: "Rabia",
      dosis: "1 dosis - 1ml",
      fechaAplicacion: diasAtras(340),
      intervaloDias: 365,
      proximaDosis: diasAdelante(25),
      mascotaId: luna.id,
      veterinarioId: vet1.id,
    },
  });
  await prisma.vacuna.create({
    data: {
      tipo: "Triple felina",
      dosis: "1 dosis - 0.5ml",
      fechaAplicacion: diasAtras(370),
      intervaloDias: 365,
      proximaDosis: diasAtras(5), // ¡atrasada! para mostrar alerta en el demo
      mascotaId: michi.id,
      veterinarioId: vet1.id,
    },
  });
  await prisma.vacuna.create({
    data: {
      tipo: "Desparasitación",
      dosis: "1 tableta",
      fechaAplicacion: diasAtras(20),
      intervaloDias: 90,
      proximaDosis: diasAdelante(70),
      mascotaId: rocky.id,
      veterinarioId: vet2.id,
    },
  });

  // ── Consulta histórica ──
  await prisma.consulta.create({
    data: {
      motivo: "Control general",
      sintomas: "Apatía leve, apetito normal",
      diagnostico: "Paciente sano, ligero sobrepeso",
      tratamiento: "Dieta balanceada y ejercicio diario de 30 min",
      mascotaId: luna.id,
      veterinarioId: vet1.id,
      createdAt: diasAtras(15),
    },
  });

  // ── Citas de hoy y mañana ──
  const hoy = new Date();
  const citaHoy = new Date(hoy);
  citaHoy.setHours(17, 0, 0, 0);
  if (citaHoy < new Date()) citaHoy.setDate(citaHoy.getDate() + 1);

  await prisma.cita.create({
    data: {
      fechaHora: citaHoy,
      motivo: "Vacunación antirrábica",
      estado: "CONFIRMADA",
      mascotaId: luna.id,
      veterinarioId: vet1.id,
    },
  });
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);
  manana.setHours(10, 0, 0, 0);
  await prisma.cita.create({
    data: {
      fechaHora: manana,
      motivo: "Control dermatológico",
      estado: "CONFIRMADA",
      mascotaId: rocky.id,
      veterinarioId: vet2.id,
    },
  });

  console.log("✅ Seed listo. Usuarios de demostración (contraseñas tomadas de las variables SEED_PASS_*):");
  console.log("   👩‍⚕️ vet@huellitas.dev        (Veterinario)");
  console.log("   🧑‍⚕️ vet2@huellitas.dev       (Veterinario 2)");
  console.log("   🗂️ recepcion@huellitas.dev (Recepcionista)");
  console.log("   🐶 cliente@huellitas.dev    (Cliente)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
