// Usuarios del sistema
export const USUARIOS = [
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

// Tipos de solicitud con tiempos estimados de entrega
export const TIPOS_SOLICITUD = [
  {
    id: 'registro_control',
    nombre: 'Registro y Control',
    descripcion: 'Solicitudes relacionadas con registro académico y control',
    icono: 'ClipboardList',
    color: 'blue',
    tiempoEntrega: '2 a 3 días hábiles',
    tiempoDetalle: 'Las solicitudes de registro y control se procesan en un promedio de 2 a 3 días hábiles después de ser recibidas.',
  },
  {
    id: 'cubrimiento_eventos',
    nombre: 'Cubrimiento de Eventos',
    descripcion: 'Solicitar cubrimiento fotográfico o audiovisual de eventos',
    icono: 'Camera',
    color: 'purple',
    tiempoEntrega: 'Solicitar con mínimo 5 días de anticipación',
    tiempoDetalle: 'El cubrimiento de eventos debe solicitarse con al menos 5 días hábiles de anticipación para garantizar disponibilidad del equipo.',
  },
  {
    id: 'piezas_graficas',
    nombre: 'Piezas Gráficas',
    descripcion: 'Diseño de afiches, banners, publicaciones y material gráfico',
    icono: 'Palette',
    color: 'pink',
    tiempoEntrega: '3 a 5 días hábiles',
    tiempoDetalle: 'El diseño de piezas gráficas toma entre 3 y 5 días hábiles dependiendo de la complejidad. Incluye una ronda de ajustes.',
  },
  {
    id: 'certificados',
    nombre: 'Certificados',
    descripcion: 'Diseño y elaboración de certificados institucionales',
    icono: 'Award',
    color: 'amber',
    tiempoEntrega: '3 a 5 días hábiles',
    tiempoDetalle: 'Los certificados se elaboran en un promedio de 3 a 5 días hábiles. Para cantidades superiores a 50 unidades, el tiempo puede extenderse.',
  },
  {
    id: 'proyectos',
    nombre: 'Proyectos',
    descripcion: 'Proyectos especiales de comunicación y contenido',
    icono: 'FolderOpen',
    color: 'emerald',
    tiempoEntrega: 'Se define en reunión de planeación',
    tiempoDetalle: 'Los proyectos especiales requieren una reunión de planeación previa donde se definirán tiempos, alcance y entregables.',
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

// Franjas horarias fijas de la radio
export const FRANJAS_RADIO = [
  '11:30 a.m.',
  '12:00 p.m.',
  '12:30 p.m.',
  '2:30 p.m.',
  '3:00 p.m.',
  '3:30 p.m.',
  '4:00 p.m.',
  '4:30 p.m.',
  '5:00 p.m.',
  '5:40 p.m.',
];

// Días de la semana
export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

// Programas fijos (no se pueden mover ni reservar)
export const PROGRAMAS_FIJOS = [
  { programa: 'Inglés y Francés', dia: 'Jueves', hora: '12:00 p.m.' },
  { programa: 'Un Café con Bienestar', dia: 'Jueves', hora: '3:00 p.m.' },
  { programa: 'Conexión en Calma', dia: 'Miércoles', hora: '5:00 p.m.' },
  { programa: 'Código Abierto', dia: 'Jueves', hora: '5:00 p.m.' },
];

// Campos de formulario por tipo de solicitud
export const CAMPOS_SOLICITUD = {
  registro_control: [
    { name: 'titulo', label: '¿Qué necesita?', type: 'text', required: true },
    { name: 'programa_academico', label: 'Programa académico', type: 'text', required: true },
    { name: 'descripcion', label: 'Descripción detallada', type: 'textarea', required: true },
    { name: 'fecha_requerida', label: 'Fecha en la que lo necesita', type: 'date', required: true },
  ],
  cubrimiento_eventos: [
    { name: 'titulo', label: 'Nombre del evento', type: 'text', required: true },
    { name: 'fecha_evento', label: 'Fecha del evento', type: 'date', required: true },
    { name: 'hora_inicio', label: 'Hora de inicio', type: 'time', required: true },
    { name: 'hora_fin', label: 'Hora de finalización', type: 'time', required: true },
    { name: 'lugar', label: 'Lugar del evento', type: 'text', required: true },
    { name: 'tipo_cubrimiento', label: 'Tipo de cubrimiento', type: 'select', required: true, opciones: ['Fotográfico', 'Audiovisual', 'Fotográfico y audiovisual', 'Transmisión en vivo'] },
    { name: 'descripcion', label: 'Descripción del evento', type: 'textarea', required: true },
  ],
  piezas_graficas: [
    { name: 'titulo', label: 'Nombre de la pieza', type: 'text', required: true },
    { name: 'tipo_pieza', label: 'Tipo de pieza', type: 'select', required: true, opciones: ['Afiche', 'Banner digital', 'Publicación redes sociales', 'Volante', 'Presentación', 'Otro'] },
    { name: 'descripcion', label: '¿Qué debe incluir la pieza?', type: 'textarea', required: true },
    { name: 'texto_contenido', label: 'Texto que debe llevar', type: 'textarea', required: true },
    { name: 'fecha_requerida', label: 'Fecha en la que lo necesita', type: 'date', required: true },
  ],
  certificados: [
    { name: 'titulo', label: 'Nombre del certificado', type: 'text', required: true },
    { name: 'evento_actividad', label: 'Evento o actividad', type: 'text', required: true },
    { name: 'cantidad', label: 'Cantidad de certificados', type: 'number', required: true },
    { name: 'archivo_datos', label: 'Archivo con los datos de las personas (Excel, CSV o PDF)', type: 'file', required: true, ayuda: 'Sube un archivo con los nombres completos y datos de las personas que recibirán el certificado.' },
    { name: 'descripcion', label: 'Información adicional', type: 'textarea', required: false },
    { name: 'fecha_requerida', label: 'Fecha en la que lo necesita', type: 'date', required: true },
  ],
  proyectos: [
    { name: 'titulo', label: 'Nombre del proyecto', type: 'text', required: true },
    { name: 'objetivo', label: 'Objetivo del proyecto', type: 'textarea', required: true },
    { name: 'descripcion', label: 'Descripción detallada', type: 'textarea', required: true },
    { name: 'fecha_inicio', label: 'Fecha de inicio estimada', type: 'date', required: true },
    { name: 'fecha_fin', label: 'Fecha de entrega estimada', type: 'date', required: true },
  ],
};

// Solicitudes de ejemplo
export const SOLICITUDES_EJEMPLO = [
  {
    id: 'SOL-001',
    tipo: 'cubrimiento_eventos',
    tipoNombre: 'Cubrimiento de Eventos',
    titulo: 'Semana de la Ingeniería 2026',
    descripcion: 'Se requiere cubrimiento fotográfico y audiovisual completo del evento.',
    solicitante: { id: 7, nombre: 'Prof. María López', cargo: 'Docente - Facultad de Ingeniería' },
    fechaCreacion: '2026-02-20',
    estado: 'en_proceso',
    asignadoA: { id: 5, nombre: 'Andrés Ruiz' },
    prioridad: 'alta',
    tiempoEntrega: 'Solicitar con mínimo 5 días de anticipación',
    datos: { fecha_evento: '2026-03-15', hora_inicio: '09:00', hora_fin: '17:00', lugar: 'Auditorio Principal', tipo_cubrimiento: 'Fotográfico y audiovisual' },
  },
  {
    id: 'SOL-002',
    tipo: 'piezas_graficas',
    tipoNombre: 'Piezas Gráficas',
    titulo: 'Afiche Congreso de Ciencias',
    descripcion: 'Diseño de afiche para el congreso anual de ciencias.',
    solicitante: { id: 8, nombre: 'Prof. Juan Rodríguez', cargo: 'Docente - Facultad de Ciencias' },
    fechaCreacion: '2026-02-22',
    estado: 'pendiente',
    asignadoA: null,
    prioridad: 'media',
    tiempoEntrega: '3 a 5 días hábiles',
    datos: { tipo_pieza: 'Afiche', texto_contenido: 'Congreso Anual de Ciencias 2026 - 20 y 21 de Abril', fecha_requerida: '2026-03-10' },
  },
  {
    id: 'SOL-003',
    tipo: 'certificados',
    tipoNombre: 'Certificados',
    titulo: 'Certificados Diplomado en Derecho Penal',
    descripcion: 'Certificados de asistencia al diplomado.',
    solicitante: { id: 9, nombre: 'Ana Martínez', cargo: 'Decana - Facultad de Derecho' },
    fechaCreacion: '2026-02-18',
    estado: 'completada',
    asignadoA: { id: 3, nombre: 'Carlos Méndez' },
    prioridad: 'media',
    tiempoEntrega: '3 a 5 días hábiles',
    datos: { evento_actividad: 'Diplomado en Derecho Penal', cantidad: '45', fecha_requerida: '2026-02-25' },
  },
  {
    id: 'SOL-004',
    tipo: 'registro_control',
    tipoNombre: 'Registro y Control',
    titulo: 'Actualización de horarios semestre 2026-1',
    descripcion: 'Se necesita publicar la actualización de horarios del nuevo semestre.',
    solicitante: { id: 10, nombre: 'Roberto Díaz', cargo: 'Registro y Control' },
    fechaCreacion: '2026-02-25',
    estado: 'pendiente',
    asignadoA: null,
    prioridad: 'alta',
    tiempoEntrega: '2 a 3 días hábiles',
    datos: { programa_academico: 'Todos los programas', fecha_requerida: '2026-03-01' },
  },
  {
    id: 'SOL-005',
    tipo: 'proyectos',
    tipoNombre: 'Proyectos',
    titulo: 'Video institucional Facultad de Derecho',
    descripcion: 'Producción de video institucional para la facultad.',
    solicitante: { id: 9, nombre: 'Ana Martínez', cargo: 'Decana - Facultad de Derecho' },
    fechaCreacion: '2026-02-15',
    estado: 'en_proceso',
    asignadoA: { id: 5, nombre: 'Andrés Ruiz' },
    prioridad: 'alta',
    tiempoEntrega: 'Se define en reunión de planeación',
    datos: { objetivo: 'Promocionar la facultad', fecha_inicio: '2026-02-20', fecha_fin: '2026-03-30' },
  },
];

// Reservas de radio de ejemplo (con formulario completo)
export const RESERVAS_RADIO_EJEMPLO = [
  {
    id: 1,
    dia: 'Lunes',
    hora: '12:00 p.m.',
    semana: '2026-03-02',
    estado: 'aprobada',
    solicitante: { id: 7, nombre: 'Prof. María López' },
    formulario: {
      responsable: 'Prof. María López',
      fecha: '2026-03-02',
      nombre_programa: 'Voces de Ingeniería',
      tema: 'Innovación tecnológica en Colombia',
      duracion: '45 minutos',
      conductor: { nombre: 'Prof. María López', perfil: 'Ingeniera de Sistemas, Magíster en TI', contacto: '3101234567' },
      invitados: [
        { nombre: 'Dr. Carlos Pérez', perfil: 'Ingeniero Electrónico, PhD en Robótica', contacto: '3109876543', cedula: '1020304050' },
      ],
      contenido: 'Entrevista sobre los avances en inteligencia artificial aplicada a la educación universitaria en Colombia.',
    },
  },
  {
    id: 2,
    dia: 'Martes',
    hora: '3:00 p.m.',
    semana: '2026-03-02',
    estado: 'pendiente',
    solicitante: { id: 9, nombre: 'Ana Martínez' },
    formulario: {
      responsable: 'Ana Martínez',
      fecha: '2026-03-03',
      nombre_programa: 'Debates Jurídicos',
      tema: 'Reforma a la justicia 2026',
      duracion: '1 hora',
      conductor: { nombre: 'Ana Martínez', perfil: 'Abogada, Especialista en Derecho Constitucional', contacto: '3151234567' },
      invitados: [
        { nombre: 'Dr. Luis Ramírez', perfil: 'Abogado penalista', contacto: '3159876543', cedula: '80123456' },
        { nombre: 'Dra. Paola Suárez', perfil: 'Constitucionalista', contacto: '3201234567', cedula: '52345678' },
      ],
      contenido: 'Mesa de debate sobre los puntos clave de la reforma a la justicia propuesta para 2026 y su impacto en la educación.',
    },
  },
];

// Mensajes urgentes de ejemplo
export const URGENTES_EJEMPLO = [
  {
    id: 1,
    titulo: 'Comunicado urgente del Rector',
    descripcion: 'Se necesita difundir comunicado oficial del Rector sobre cambio de calendario académico. Máxima prioridad.',
    solicitante: { id: 2, nombre: 'Director General', cargo: 'Director' },
    fechaCreacion: '2026-02-26',
    estado: 'pendiente',
  },
];

// Helper: Obtener datos de localStorage o usar datos por defecto
export function obtenerSolicitudes() {
  const guardadas = localStorage.getItem('comunidesk_solicitudes');
  return guardadas ? JSON.parse(guardadas) : [...SOLICITUDES_EJEMPLO];
}

export function guardarSolicitudes(solicitudes) {
  localStorage.setItem('comunidesk_solicitudes', JSON.stringify(solicitudes));
}

export function obtenerReservasRadio() {
  const guardadas = localStorage.getItem('comunidesk_reservas_radio');
  return guardadas ? JSON.parse(guardadas) : [...RESERVAS_RADIO_EJEMPLO];
}

export function guardarReservasRadio(reservas) {
  localStorage.setItem('comunidesk_reservas_radio', JSON.stringify(reservas));
}

export function obtenerUrgentes() {
  const guardadas = localStorage.getItem('comunidesk_urgentes');
  return guardadas ? JSON.parse(guardadas) : [...URGENTES_EJEMPLO];
}

export function guardarUrgentes(urgentes) {
  localStorage.setItem('comunidesk_urgentes', JSON.stringify(urgentes));
}

export function generarIdSolicitud() {
  const solicitudes = obtenerSolicitudes();
  const num = solicitudes.length + 1;
  return `SOL-${String(num).padStart(3, '0')}`;
}

// Usuarios registrados (persistencia en localStorage)
export function obtenerUsuariosRegistrados() {
  const guardados = localStorage.getItem('comunidesk_usuarios_registrados');
  return guardados ? JSON.parse(guardados) : [];
}

export function guardarUsuarioRegistrado(usuario) {
  const usuarios = obtenerUsuariosRegistrados();
  usuarios.push(usuario);
  localStorage.setItem('comunidesk_usuarios_registrados', JSON.stringify(usuarios));
  return usuario;
}

export function generarIdUsuario() {
  const registrados = obtenerUsuariosRegistrados();
  return 100 + registrados.length + 1;
}
