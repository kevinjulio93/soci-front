/**
 * OTP Service - Servicio para verificación por código OTP
 * Maneja solicitud, verificación y consulta de estado de códigos OTP
 */

import { EXTERNAL_URLS } from '../constants'

// Derivar la URL base para OTP (mismo host, ruta /api/v1/otp)
const getOtpBaseUrl = (): string => {
  const apiUrl = EXTERNAL_URLS.API_BASE_URL
  // API_BASE_URL ya es .../api/v1, solo agregar /otp
  return `${apiUrl.replace(/\/$/, '')}/otp`
}

// --- Tipos de respuesta ---

interface OTPRequestResponse {
  success: boolean
  message: string
  expiresIn?: number
  remainingSeconds?: number
}

interface OTPVerifyResponse {
  success: boolean
  message: string
  phoneNumber?: string
  remainingAttempts?: number
}

interface OTPStatusResponse {
  success: boolean
  data?: {
    phoneNumber: string
    attempts: number
    remainingSeconds: number
    expiresAt: string
  }
}

// --- Servicio ---

class OTPService {
  private baseUrl: string

  constructor() {
    this.baseUrl = getOtpBaseUrl()
  }

  /**
   * Formatear número con prefijo +57 si no lo tiene
   */
  private formatPhone(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '')
    if (cleaned.startsWith('+57')) return cleaned
    if (cleaned.startsWith('57') && cleaned.length > 10) return `+${cleaned}`
    return `+57${cleaned}`
  }

  /**
   * Solicitar envío de OTP por SMS usando el respondentId
   */
  async requestOTP(respondentId: string): Promise<OTPRequestResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentId }),
      })
      return await response.json()
    } catch {
      return {
        success: false,
        message: 'No se pudo enviar el código. Verifica tu conexión a internet.',
      }
    }
  }

  /**
   * Verificar código OTP ingresado por el usuario
   */
  async verifyOTP(respondentId: string, code: string): Promise<OTPVerifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ respondentId, code }),
      })
      return await response.json()
    } catch {
      return {
        success: false,
        message: 'No se pudo verificar el código. Verifica tu conexión a internet.',
      }
    }
  }

  /**
   * Consultar estado del OTP (debug / info)
   */
  async getStatus(phoneNumber: string): Promise<OTPStatusResponse> {
    try {
      const encoded = encodeURIComponent(this.formatPhone(phoneNumber))
      const response = await fetch(`${this.baseUrl}/status/${encoded}`)
      return await response.json()
    } catch {
      return { success: false }
    }
  }
}

export const otpService = new OTPService()
