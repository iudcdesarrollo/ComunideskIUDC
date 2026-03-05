import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const USUARIOS = [
  {
    nombre: 'Administrador Comunicaciones',
    email: 'admin@iudc.edu.co',
    password: 'admin123',
    rol: 'ADMIN',
    cargo: 'Coordinador de Comunicaciones',
  },
  {
    nombre: 'Aleja',
    email: 'aleja@iudc.edu.co',
    password: 'equipo123',
    rol: 'EQUIPO',
    cargo: 'Videógrafa',
  },
  {
    nombre: 'Ivan',
    email: 'ivan@iudc.edu.co',
    password: 'equipo123',
    rol: 'EQUIPO',
    cargo: 'Creativo Multimedia',
  },
  {
    nombre: 'Luis',
    email: 'luis@iudc.edu.co',
    password: 'equipo123',
    rol: 'EQUIPO',
    cargo: 'Web Master',
  },
];

const TIPOS_SOLICITUD = [
  {
    id: 'registro_control',
    nombre: 'Registro y Control',
    descripcion: 'Solicitudes relacionadas con registro académico y control',
    icono: 'ClipboardList',
    color: 'blue',
    tiempoEntrega: '2 a 3 días hábiles',
    tiempoDetalle:
      'Las solicitudes de registro y control se procesan en un promedio de 2 a 3 días hábiles después de ser recibidas.',
  },
  {
    id: 'cubrimiento_eventos',
    nombre: 'Cubrimiento de Eventos',
    descripcion: 'Solicitar cubrimiento fotográfico o audiovisual de eventos',
    icono: 'Camera',
    color: 'purple',
    tiempoEntrega: 'Solicitar con mínimo 5 días de anticipación',
    tiempoDetalle:
      'El cubrimiento de eventos debe solicitarse con al menos 5 días hábiles de anticipación para garantizar disponibilidad del equipo.',
  },
  {
    id: 'piezas_graficas',
    nombre: 'Piezas Gráficas',
    descripcion: 'Diseño de afiches, banners, publicaciones y material gráfico',
    icono: 'Palette',
    color: 'pink',
    tiempoEntrega: '3 a 5 días hábiles',
    tiempoDetalle:
      'El diseño de piezas gráficas toma entre 3 y 5 días hábiles dependiendo de la complejidad. Incluye una ronda de ajustes.',
  },
  {
    id: 'certificados',
    nombre: 'Certificados',
    descripcion: 'Diseño y elaboración de certificados institucionales',
    icono: 'Award',
    color: 'amber',
    tiempoEntrega: '3 a 5 días hábiles',
    tiempoDetalle:
      'Los certificados se elaboran en un promedio de 3 a 5 días hábiles. Para cantidades superiores a 50 unidades, el tiempo puede extenderse.',
  },
  {
    id: 'proyectos',
    nombre: 'Proyectos',
    descripcion: 'Proyectos especiales de comunicación y contenido',
    icono: 'FolderOpen',
    color: 'emerald',
    tiempoEntrega: 'Se define en reunión de planeación',
    tiempoDetalle:
      'Los proyectos especiales requieren una reunión de planeación previa donde se definirán tiempos, alcance y entregables.',
  },
  {
    id: 'radio',
    nombre: 'Radio IUDC',
    descripcion: 'Agendar espacios en la parrilla de Radio IUDC',
    icono: 'Radio',
    color: 'red',
    tiempoEntrega: '',
    tiempoDetalle: '',
  },
];

const PROGRAMAS_FIJOS = [
  { programa: 'Inglés y Francés', dia: 'Jueves', hora: '12:00 p.m.' },
  { programa: 'Un Café con Bienestar', dia: 'Jueves', hora: '3:00 p.m.' },
  { programa: 'Conexión en Calma', dia: 'Miércoles', hora: '5:00 p.m.' },
  { programa: 'Código Abierto', dia: 'Jueves', hora: '5:00 p.m.' },
];

async function main() {
  console.log('🌱 Starting production seed...');

  // ─── Check current database state ─────────────────────
  const existingUsers = await prisma.user.count();
  const existingTipos = await prisma.tipoSolicitud.count();
  const existingProgramas = await prisma.programaFijo.count();

  // ─── Full seed: only when database is completely empty ─
  if (existingUsers === 0) {
    console.log('📦 Empty database detected. Running full seed...');

    // Clear everything in correct FK order
    await prisma.notificacion.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.urgente.deleteMany();
    await prisma.reservaRadio.deleteMany();
    await prisma.solicitud.deleteMany();
    await prisma.tipoSolicitud.deleteMany();
    await prisma.programaFijo.deleteMany();
    await prisma.user.deleteMany();

    // Create 4 production users
    for (const u of USUARIOS) {
      const hashedPassword = await bcrypt.hash(u.password, SALT_ROUNDS);
      await prisma.user.create({
        data: {
          nombre: u.nombre,
          email: u.email,
          password: hashedPassword,
          rol: u.rol,
          cargo: u.cargo,
        },
      });
    }
    console.log('✓ Created 4 users (passwords hashed with bcrypt)');
  } else {
    console.log('✅ Users already exist (' + existingUsers + ' found). Skipping user creation.');
  }

  // ─── Ensure tipos de solicitud exist (repair if missing) ─
  if (existingTipos === 0) {
    console.log('⚠️  No tipos de solicitud found. Recreating...');
    for (const tipo of TIPOS_SOLICITUD) {
      await prisma.tipoSolicitud.upsert({
        where: { id: tipo.id },
        update: {},
        create: tipo,
      });
    }
    console.log('✓ Created 6 tipos de solicitud');
  } else {
    console.log('✅ Tipos de solicitud already exist (' + existingTipos + ' found).');
  }

  // ─── Ensure programas fijos exist (repair if missing) ───
  if (existingProgramas === 0) {
    console.log('⚠️  No programas fijos found. Recreating...');
    for (const prog of PROGRAMAS_FIJOS) {
      await prisma.programaFijo.create({ data: prog });
    }
    console.log('✓ Created 4 programas fijos');
  } else {
    console.log('✅ Programas fijos already exist (' + existingProgramas + ' found).');
  }

  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
