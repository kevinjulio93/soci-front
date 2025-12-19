/**
 * audioConverter - Utilidades para convertir audio a MP3
 * Usa lamejs para encodear audio a formato MP3
 */

// @ts-ignore - lamejs no tiene tipos oficiales
import lamejs from 'lamejs'
import { AUDIO_CONFIG, FILE_CONFIG } from '../constants'

/**
 * Convierte un Blob de audio a MP3
 * @param audioBlob - Blob de audio en cualquier formato soportado por el navegador
 * @returns Promise<Blob> - Blob de audio en formato MP3
 */
export async function convertToMp3(audioBlob: Blob): Promise<Blob> {
  try {
    // Crear un AudioContext para decodificar el audio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Leer el blob como ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer()
    
    // Decodificar el audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    
    // Obtener los datos de audio (mono o estéreo)
    const channels = audioBuffer.numberOfChannels
    const sampleRate = audioBuffer.sampleRate
    const samples = audioBuffer.length
    
    // Convertir a mono si es estéreo (MP3 encoder trabaja mejor con mono para voz)
    let leftChannel: Float32Array
    // let rightChannel: Float32Array | null = null
    
    if (channels === 1) {
      leftChannel = audioBuffer.getChannelData(0)
    } else {
      // Si es estéreo, mezclar a mono
      const left = audioBuffer.getChannelData(0)
      const right = audioBuffer.getChannelData(1)
      leftChannel = new Float32Array(samples)
      
      for (let i = 0; i < samples; i++) {
        leftChannel[i] = (left[i] + right[i]) / 2
      }
    }
    
    // Convertir Float32Array a Int16Array (requerido por lamejs)
    const int16Array = floatTo16BitPCM(leftChannel)
    
    // Configurar el encoder MP3
    const mp3encoder = new lamejs.Mp3Encoder(AUDIO_CONFIG.AUDIO_CHANNELS, sampleRate, AUDIO_CONFIG.MP3_BITRATE)
    const mp3Data: Int8Array[] = []
    
    // Encodear en chunks
    const sampleBlockSize = AUDIO_CONFIG.MP3_SAMPLE_BLOCK_SIZE
    
    for (let i = 0; i < int16Array.length; i += sampleBlockSize) {
      const sampleChunk = int16Array.subarray(i, i + sampleBlockSize)
      const mp3buf = mp3encoder.encodeBuffer(sampleChunk)
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf)
      }
    }
    
    // Finalizar el encoding
    const mp3buf = mp3encoder.flush()
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf)
    }
    
    // Crear el Blob MP3 (convertir Int8Array a Uint8Array para compatibilidad)
    const mp3BlobParts = mp3Data.map(data => new Uint8Array(data.buffer) as BlobPart)
    const mp3Blob = new Blob(mp3BlobParts, { type: FILE_CONFIG.AUDIO_MIME_TYPES.MP3 })
    
    return mp3Blob
  } catch (error) {
    // Si falla la conversión, devolver el blob original
    return audioBlob
  }
}

/**
 * Convierte Float32Array a Int16Array (PCM)
 */
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length)
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]))
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
  }
  return output
}
