/**
 * Messages - Constantes de mensajes de usuario
 * Centraliza todos los mensajes de la aplicación
 */

export const MESSAGES = {
  // Validación
  VALIDATION_ERROR: 'Por favor complete los campos obligatorios',
  
  // Éxito
  UPDATE_SUCCESS: 'Encuestado actualizado exitosamente',
  CREATE_SUCCESS: 'Encuestado creado exitosamente',
  AUDIO_SUCCESS: 'Audio subido exitosamente',
  
  // Errores
  SAVE_ERROR: 'Error al guardar los datos',
  AUDIO_UPLOAD_ERROR: 'Error al subir el audio',
  AUDIO_ERROR: 'Advertencia: El encuestado fue creado pero el audio no se pudo subir',
  RECORDING_ERROR: 'Error de grabación',
  
  // Estados de carga
  LOADING_DATA: 'Cargando datos del encuestado...',
  LOAD_ERROR: 'No se pudieron cargar los datos del encuestado',
} as const
