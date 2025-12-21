/**
 * Messages - Constantes de mensajes de usuario
 * Centraliza todos los mensajes de la aplicación
 */

export const MESSAGES = {
  // Validación
  VALIDATION_ERROR: 'Por favor complete los campos obligatorios',
  
  // Éxito - Encuestados
  RESPONDENT_UPDATE_SUCCESS: 'Encuestado actualizado exitosamente',
  RESPONDENT_CREATE_SUCCESS: 'Encuestado creado exitosamente',
  RESPONDENT_DELETE_SUCCESS: 'Encuestado eliminado exitosamente',
  AUDIO_SUCCESS: 'Audio subido exitosamente',
  
  // Éxito - Usuarios/Socializadores
  USER_CREATE_SUCCESS: 'Usuario creado correctamente',
  USER_UPDATE_SUCCESS: 'Usuario actualizado correctamente',
  USER_DELETE_SUCCESS: 'Usuario eliminado correctamente',
  
  // Éxito - Coordinador
  COORDINATOR_ASSIGN_SUCCESS: 'Coordinador asignado correctamente',
  COORDINATOR_UNASSIGN_SUCCESS: 'Coordinador desasignado correctamente',
  
  // Errores - General
  GENERIC_ERROR: 'Ha ocurrido un error',
  SAVE_ERROR: 'Error al guardar los datos',
  LOAD_ERROR: 'Error al cargar los datos',
  DELETE_ERROR: 'Error al eliminar',
  
  // Errores - Encuestados
  RESPONDENT_SAVE_ERROR: 'Error al guardar el encuestado',
  RESPONDENT_LOAD_ERROR: 'No se pudieron cargar los datos del encuestado',
  
  // Errores - Usuarios
  USER_SAVE_ERROR: 'Error al guardar el usuario',
  USER_DELETE_ERROR: 'Error al eliminar el usuario',
  USER_LOAD_ERROR: 'Error al cargar el usuario',
  
  // Errores - Audio
  AUDIO_UPLOAD_ERROR: 'Error al subir el audio',
  AUDIO_WARNING: 'Advertencia: El encuestado fue creado pero el audio no se pudo subir',
  RECORDING_ERROR: 'Error de grabación',
  
  // Errores - Ubicación
  LOCATION_LOAD_ERROR: 'No se pudo cargar la ubicación',
  LOCATION_UNAVAILABLE: 'No se puede obtener la ubicación de este socializador',
  
  // Errores - Estadísticas
  STATS_LOAD_ERROR: 'Error al cargar las estadísticas',
  
  // Estados de carga
  LOADING: 'Cargando...',
  LOADING_DATA: 'Cargando datos...',
  LOADING_LOCATION: 'Cargando ubicación...',
  LOADING_STATS: 'Cargando estadísticas...',
  SAVING: 'Guardando...',
  PROCESSING: 'Procesando...',
  
  // Confirmaciones
  CONFIRM_DELETE_USER: '¿Está seguro de eliminar a {name}? Esta acción no se puede deshacer.',
  CONFIRM_DELETE_RESPONDENT: '¿Está seguro de eliminar a {name}?',
  
  // Estados sin datos
  NO_DATA: 'Sin datos',
  NO_RESULTS: 'No se encontraron resultados',
  
  // Botones
  BTN_CREATE: 'Crear Usuario',
  BTN_UPDATE: 'Actualizar',
  BTN_SAVE: 'Guardar',
  BTN_CANCEL: 'Cancelar',
  BTN_DELETE: 'Eliminar',
  BTN_CONFIRM: 'Confirmar',
  BTN_CLOSE: 'Cerrar',
  
  // Títulos
  TITLE_NEW_USER: 'Nuevo Usuario',
  TITLE_EDIT_USER: 'Editar Usuario',
  TITLE_DELETE_USER: 'Eliminar Usuario',
  TITLE_DELETE_RESPONDENT: 'Eliminar Encuestado',
  TITLE_LOCATION: 'Ubicación de {name}',
  
  // Labels
  LABEL_FULL_NAME: 'Nombre Completo',
  LABEL_ID_TYPE: 'Tipo ID',
  LABEL_ID_NUMBER: 'Número de Identificación',
  LABEL_PHONE: 'Teléfono',
  LABEL_EMAIL: 'Correo Electrónico',
  LABEL_PASSWORD: 'Contraseña',
  LABEL_ROLE: 'Rol',
  LABEL_COORDINATOR: 'Supervisor',
  LABEL_LATITUDE: 'Latitud',
  LABEL_LONGITUDE: 'Longitud',
  LABEL_ACCURACY: 'Precisión',
  LABEL_LAST_UPDATE: 'Última actualización',
  
  // Tooltips
  TOOLTIP_EDIT: 'Editar',
  TOOLTIP_DELETE: 'Eliminar',
  TOOLTIP_VIEW_DETAILS: 'Ver detalles',
  TOOLTIP_VIEW_LOCATION: 'Ver ubicación',
  TOOLTIP_REFRESH: 'Actualizar ubicación',
  TOOLTIP_OPEN_MAPS: 'Abrir en Google Maps',
  TOOLTIP_PLAY_AUDIO: 'Reproducir audio',
  TOOLTIP_PAUSE_AUDIO: 'Pausar audio',
} as const
