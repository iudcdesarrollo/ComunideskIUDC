import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

const USUARIOS = [
  {
    id: 1,
    nombre: 'Administrador Comunicaciones',
    email: 'admin@iudc.edu.co',
    password: 'admin123',
    rol: 'admin',
    cargo: 'Coordinador de Comunicaciones',
  },
  {
    id: 2,
    nombre: 'Director General',
    email: 'director@iudc.edu.co',
    password: 'director123',
    rol: 'director',
    cargo: 'Director',
  },
  {
    id: 3,
    nombre: 'Carlos Méndez',
    email: 'carlos@iudc.edu.co',
    password: 'equipo123',
    rol: 'equipo',
    cargo: 'Diseñador Gráfico',
  },
  {
    id: 4,
    nombre: 'Laura Gómez',
    email: 'laura@iudc.edu.co',
    password: 'equipo123',
    rol: 'equipo',
    cargo: 'Community Manager',
  },
  {
    id: 5,
    nombre: 'Andrés Ruiz',
    email: 'andres@iudc.edu.co',
    password: 'equipo123',
    rol: 'equipo',
    cargo: 'Productor Audiovisual',
  },
  {
    id: 6,
    nombre: 'Sofía Herrera',
    email: 'sofia@iudc.edu.co',
    password: 'equipo123',
    rol: 'equipo',
    cargo: 'Periodista',
  },
  {
    id: 7,
    nombre: 'Prof. María López',
    email: 'maria.lopez@iudc.edu.co',
    password: 'docente123',
    rol: 'solicitante',
    cargo: 'Docente - Facultad de Ingeniería',
  },
  {
    id: 8,
    nombre: 'Prof. Juan Rodríguez',
    email: 'juan.rodriguez@iudc.edu.co',
    password: 'docente123',
    rol: 'solicitante',
    cargo: 'Docente - Facultad de Ciencias',
  },
  {
    id: 9,
    nombre: 'Ana Martínez',
    email: 'ana.martinez@iudc.edu.co',
    password: 'docente123',
    rol: 'solicitante',
    cargo: 'Decana - Facultad de Derecho',
  },
  {
    id: 10,
    nombre: 'Roberto Díaz',
    email: 'roberto.diaz@iudc.edu.co',
    password: 'docente123',
    rol: 'solicitante',
    cargo: 'Registro y Control',
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

const SOLICITUDES_EJEMPLO = [
  {
    id: 'SOL-001',
    tipo: 'cubrimiento_eventos',
    titulo: 'Semana de la Ingeniería 2026',
    descripcion:
      'Se requiere cubrimiento fotográfico y audiovisual completo del evento.',
    solicitante: { id: 7 },
    fechaCreacion: '2026-02-20',
    estado: 'en_proceso',
    asignadoA: { id: 5 },
    prioridad: 'alta',
    tiempoEntrega: 'Solicitar con mínimo 5 días de anticipación',
    datos: {
      fecha_evento: '2026-03-15',
      hora_inicio: '09:00',
      hora_fin: '17:00',
      lugar: 'Auditorio Principal',
      tipo_cubrimiento: 'Fotográfico y audiovisual',
    },
  },
  {
    id: 'SOL-002',
    tipo: 'piezas_graficas',
    titulo: 'Afiche Congreso de Ciencias',
    descripcion: 'Diseño de afiche para el congreso anual de ciencias.',
    solicitante: { id: 8 },
    fechaCreacion: '2026-02-22',
    estado: 'pendiente',
    asignadoA: null,
    prioridad: 'media',
    tiempoEntrega: '3 a 5 días hábiles',
    datos: {
      tipo_pieza: 'Afiche',
      texto_contenido: 'Congreso Anual de Ciencias 2026 - 20 y 21 de Abril',
      fecha_requerida: '2026-03-10',
    },
  },
  {
    id: 'SOL-003',
    tipo: 'certificados',
    titulo: 'Certificados Diplomado en Derecho Penal',
    descripcion: 'Certificados de asistencia al diplomado.',
    solicitante: { id: 9 },
    fechaCreacion: '2026-02-18',
    estado: 'completada',
    asignadoA: { id: 3 },
    prioridad: 'media',
    tiempoEntrega: '3 a 5 días hábiles',
    datos: {
      evento_actividad: 'Diplomado en Derecho Penal',
      cantidad: '45',
      fecha_requerida: '2026-02-25',
    },
  },
  {
    id: 'SOL-004',
    tipo: 'registro_control',
    titulo: 'Actualización de horarios semestre 2026-1',
    descripcion:
      'Se necesita publicar la actualización de horarios del nuevo semestre.',
    solicitante: { id: 10 },
    fechaCreacion: '2026-02-25',
    estado: 'pendiente',
    asignadoA: null,
    prioridad: 'alta',
    tiempoEntrega: '2 a 3 días hábiles',
    datos: {
      programa_academico: 'Todos los programas',
      fecha_requerida: '2026-03-01',
    },
  },
  {
    id: 'SOL-005',
    tipo: 'proyectos',
    titulo: 'Video institucional Facultad de Derecho',
    descripcion: 'Producción de video institucional para la facultad.',
    solicitante: { id: 9 },
    fechaCreacion: '2026-02-15',
    estado: 'en_proceso',
    asignadoA: { id: 5 },
    prioridad: 'alta',
    tiempoEntrega: 'Se define en reunión de planeación',
    datos: {
      objetivo: 'Promocionar la facultad',
      fecha_inicio: '2026-02-20',
      fecha_fin: '2026-03-30',
    },
  },
];

const RESERVAS_RADIO_EJEMPLO = [
  {
    id: 1,
    dia: 'Lunes',
    hora: '12:00 p.m.',
    semana: '2026-03-02',
    estado: 'aprobada',
    solicitante: { id: 7 },
    formulario: {
      responsable: 'Prof. María López',
      fecha: '2026-03-02',
      nombre_programa: 'Voces de Ingeniería',
      tema: 'Innovación tecnológica en Colombia',
      duracion: '45 minutos',
      conductor: {
        nombre: 'Prof. María López',
        perfil: 'Ingeniera de Sistemas, Magíster en TI',
        contacto: '3101234567',
      },
      invitados: [
        {
          nombre: 'Dr. Carlos Pérez',
          perfil: 'Ingeniero Electrónico, PhD en Robótica',
          contacto: '3109876543',
          cedula: '1020304050',
        },
      ],
      contenido:
        'Entrevista sobre los avances en inteligencia artificial aplicada a la educación universitaria en Colombia.',
    },
  },
  {
    id: 2,
    dia: 'Martes',
    hora: '3:00 p.m.',
    semana: '2026-03-02',
    estado: 'pendiente',
    solicitante: { id: 9 },
    formulario: {
      responsable: 'Ana Martínez',
      fecha: '2026-03-03',
      nombre_programa: 'Debates Jurídicos',
      tema: 'Reforma a la justicia 2026',
      duracion: '1 hora',
      conductor: {
        nombre: 'Ana Martínez',
        perfil: 'Abogada, Especialista en Derecho Constitucional',
        contacto: '3151234567',
      },
      invitados: [
        {
          nombre: 'Dr. Luis Ramírez',
          perfil: 'Abogado penalista',
          contacto: '3159876543',
          cedula: '80123456',
        },
        {
          nombre: 'Dra. Paola Suárez',
          perfil: 'Constitucionalista',
          contacto: '3201234567',
          cedula: '52345678',
        },
      ],
      contenido:
        'Mesa de debate sobre los puntos clave de la reforma a la justicia propuesta para 2026 y su impacto en la educación.',
    },
  },
];

const URGENTES_EJEMPLO = [
  {
    id: 1,
    titulo: 'Comunicado urgente del Rector',
    descripcion:
      'Se necesita difundir comunicado oficial del Rector sobre cambio de calendario académico. Máxima prioridad.',
    solicitante: { id: 2 },
    fechaCreacion: '2026-02-26',
    estado: 'pendiente',
  },
];

const PROGRAMAS_FIJOS = [
  { programa: 'Inglés y Francés', dia: 'Jueves', hora: '12:00 p.m.' },
  { programa: 'Un Café con Bienestar', dia: 'Jueves', hora: '3:00 p.m.' },
  { programa: 'Conexión en Calma', dia: 'Miércoles', hora: '5:00 p.m.' },
  { programa: 'Código Abierto', dia: 'Jueves', hora: '5:00 p.m.' },
];

const mapRol = (rol) =>
  ({
    admin: 'ADMIN',
    director: 'DIRECTOR',
    equipo: 'EQUIPO',
    solicitante: 'SOLICITANTE',
  }[rol]);

const mapEstadoSolicitud = (estado) =>
  ({
    pendiente: 'PENDIENTE',
    en_proceso: 'EN_PROCESO',
    completada: 'COMPLETADA',
    rechazada: 'RECHAZADA',
  }[estado]);

const mapPrioridad = (prioridad) =>
  ({
    alta: 'ALTA',
    media: 'MEDIA',
    baja: 'BAJA',
  }[prioridad]);

const mapEstadoReserva = (estado) =>
  ({
    pendiente: 'PENDIENTE',
    aprobada: 'APROBADA',
    rechazada: 'RECHAZADA',
  }[estado]);

const mapEstadoUrgente = (estado) =>
  ({
    pendiente: 'PENDIENTE',
    en_proceso: 'EN_PROCESO',
    resuelto: 'RESUELTO',
  }[estado]);

async function main() {
  console.log('Starting seed...');

  await prisma.refreshToken.deleteMany();
  await prisma.urgente.deleteMany();
  await prisma.reservaRadio.deleteMany();
  await prisma.solicitud.deleteMany();
  await prisma.tipoSolicitud.deleteMany();
  await prisma.programaFijo.deleteMany();
  await prisma.user.deleteMany();

  for (const userData of USUARIOS) {
    const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);
    await prisma.user.create({
      data: {
        id: userData.id,
        nombre: userData.nombre,
        email: userData.email,
        password: hashedPassword,
        rol: mapRol(userData.rol),
        cargo: userData.cargo,
      },
    });
  }

  for (const tipo of TIPOS_SOLICITUD) {
    await prisma.tipoSolicitud.create({ data: tipo });
  }

  for (const solicitud of SOLICITUDES_EJEMPLO) {
    await prisma.solicitud.create({
      data: {
        id: solicitud.id,
        tipoId: solicitud.tipo,
        titulo: solicitud.titulo,
        descripcion: solicitud.descripcion,
        solicitanteId: solicitud.solicitante.id,
        estado: mapEstadoSolicitud(solicitud.estado),
        asignadoAId: solicitud.asignadoA?.id ?? null,
        prioridad: mapPrioridad(solicitud.prioridad),
        tiempoEntrega: solicitud.tiempoEntrega,
        datos: solicitud.datos,
        createdAt: new Date(`${solicitud.fechaCreacion}T00:00:00.000Z`),
      },
    });
  }

  for (const reserva of RESERVAS_RADIO_EJEMPLO) {
    await prisma.reservaRadio.create({
      data: {
        id: reserva.id,
        dia: reserva.dia,
        hora: reserva.hora,
        semana: reserva.semana,
        estado: mapEstadoReserva(reserva.estado),
        solicitanteId: reserva.solicitante.id,
        formulario: reserva.formulario,
      },
    });
  }

  for (const urgente of URGENTES_EJEMPLO) {
    await prisma.urgente.create({
      data: {
        id: urgente.id,
        titulo: urgente.titulo,
        descripcion: urgente.descripcion,
        solicitanteId: urgente.solicitante.id,
        estado: mapEstadoUrgente(urgente.estado),
        createdAt: new Date(`${urgente.fechaCreacion}T00:00:00.000Z`),
      },
    });
  }

  for (const prog of PROGRAMAS_FIJOS) {
    await prisma.programaFijo.create({ data: prog });
  }

  const counts = {
    users: await prisma.user.count(),
    tipos: await prisma.tipoSolicitud.count(),
    solicitudes: await prisma.solicitud.count(),
    reservas: await prisma.reservaRadio.count(),
    urgentes: await prisma.urgente.count(),
    programas: await prisma.programaFijo.count(),
  };

  console.log('Seed summary:', counts);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
