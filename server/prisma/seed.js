import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('🌱 Starting seed...');

  // Clear tables in reverse dependency order
  await prisma.refreshToken.deleteMany();
  await prisma.urgente.deleteMany();
  await prisma.reservaRadio.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.tipoSolicitud.deleteMany();
  await prisma.programaFijo.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data');

  // ─── Users ───────────────────────────────────────────
  const usersData = [
    { id: 1, nombre: 'Administrador Comunicaciones', email: 'admin@iudc.edu.co', password: 'admin123', rol: 'ADMIN', cargo: 'Coordinador de Comunicaciones' },
    { id: 2, nombre: 'Aleja', email: 'aleja@iudc.edu.co', password: 'equipo123', rol: 'EQUIPO', cargo: 'Videógrafa' },
    { id: 3, nombre: 'Ivan', email: 'ivan@iudc.edu.co', password: 'equipo123', rol: 'EQUIPO', cargo: 'Creativo Multimedia' },
    { id: 4, nombre: 'Luis', email: 'luis@iudc.edu.co', password: 'equipo123', rol: 'EQUIPO', cargo: 'Web Master' },
  ];

  for (const userData of usersData) {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        id: userData.id,
        nombre: userData.nombre,
        email: userData.email,
        password: hashedPassword,
        rol: userData.rol,
        cargo: userData.cargo,
      },
    });
  }

  // Reset autoincrement sequence to continue after ID 10
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('"User"', 'id'), 4, true)`;

  console.log('✓ Created 4 users (passwords hashed with bcrypt)');

  // ─── Tipos de Solicitud ──────────────────────────────
  const tiposData = [
    { id: 'registro_control', nombre: 'Registro y Control', descripcion: 'Solicitudes relacionadas con registro académico y control', icono: 'ClipboardList', color: 'blue', tiempoEntrega: '2 a 3 días hábiles', tiempoDetalle: 'Las solicitudes de registro y control se procesan en un promedio de 2 a 3 días hábiles después de ser recibidas.' },
    { id: 'cubrimiento_eventos', nombre: 'Cubrimiento de Eventos', descripcion: 'Solicitar cubrimiento fotográfico o audiovisual de eventos', icono: 'Camera', color: 'purple', tiempoEntrega: 'Solicitar con mínimo 5 días de anticipación', tiempoDetalle: 'El cubrimiento de eventos debe solicitarse con al menos 5 días hábiles de anticipación para garantizar disponibilidad del equipo.' },
    { id: 'piezas_graficas', nombre: 'Piezas Gráficas', descripcion: 'Diseño de afiches, banners, publicaciones y material gráfico', icono: 'Palette', color: 'pink', tiempoEntrega: '3 a 5 días hábiles', tiempoDetalle: 'El diseño de piezas gráficas toma entre 3 y 5 días hábiles dependiendo de la complejidad. Incluye una ronda de ajustes.' },
    { id: 'certificados', nombre: 'Certificados', descripcion: 'Diseño y elaboración de certificados institucionales', icono: 'Award', color: 'amber', tiempoEntrega: '3 a 5 días hábiles', tiempoDetalle: 'Los certificados se elaboran en un promedio de 3 a 5 días hábiles. Para cantidades superiores a 50 unidades, el tiempo puede extenderse.' },
    { id: 'proyectos', nombre: 'Proyectos', descripcion: 'Proyectos especiales de comunicación y contenido', icono: 'FolderOpen', color: 'emerald', tiempoEntrega: 'Se define en reunión de planeación', tiempoDetalle: 'Los proyectos especiales requieren una reunión de planeación previa donde se definirán tiempos, alcance y entregables.' },
    { id: 'radio', nombre: 'Radio IUDC', descripcion: 'Agendar espacios en la parrilla de Radio IUDC', icono: 'Radio', color: 'red', tiempoEntrega: '', tiempoDetalle: '' },
  ];

  for (const tipo of tiposData) {
    await prisma.tipoSolicitud.create({ data: tipo });
  }

  console.log('✓ Created 6 tipos de solicitud');


  // ─── Programas Fijos ─────────────────────────────────
  const programasData = [
    { programa: 'Inglés y Francés', dia: 'Jueves', hora: '12:00 p.m.' },
    { programa: 'Un Café con Bienestar', dia: 'Jueves', hora: '3:00 p.m.' },
    { programa: 'Conexión en Calma', dia: 'Miércoles', hora: '5:00 p.m.' },
    { programa: 'Código Abierto', dia: 'Jueves', hora: '5:00 p.m.' },
  ];

  for (const prog of programasData) {
    await prisma.programaFijo.create({ data: prog });
  }

  console.log('✓ Created 4 programas fijos');

  // ─── Summary ─────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    tipos: await prisma.tipoSolicitud.count(),
    programas: await prisma.programaFijo.count(),
  };

  console.log('\n📊 Seed Summary:');
  console.log(`   Users: ${counts.users}`);
  console.log(`   Tipos: ${counts.tipos}`);
  console.log(`   Programas Fijos: ${counts.programas}`);
  console.log('\n✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
