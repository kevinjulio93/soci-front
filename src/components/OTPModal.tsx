/**
 * OTPModal - Modal de verificación OTP para encuestas
 * Se muestra al guardar una encuesta para validar el teléfono del encuestado.
 * Después de 15 segundos muestra un botón para cerrar.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { otpService } from '../services/otp.service'

interface OTPModalProps {
  isOpen: boolean
  /** ID del respondent creado en el backend */
  respondentId: string
  /** Número de teléfono para mostrar al usuario */
  phoneNumber: string
  onVerified: () => void
  onClose: () => void
  /** Mostrar botón "Continuar sin verificación" siempre visible */
  allowSkip?: boolean
  /** Indica si se está guardando la encuesta en background */
  isFinalizing?: boolean
}

type OTPStage = 'sending' | 'input' | 'verifying' | 'verified' | 'error'

const OTP_EXPIRATION = 60 // 1 minute
const CLOSE_BUTTON_DELAY = 15 // seconds before showing close button
const RESEND_COOLDOWN = 30 // seconds between resend requests

const OTPModal: React.FC<OTPModalProps> = ({
  isOpen,
  respondentId,
  phoneNumber,
  onVerified,
  onClose,
  allowSkip = false,
  isFinalizing = false,
}) => {
  const [stage, setStage] = useState<OTPStage>('sending')
  const [code, setCode] = useState('')
  const [message, setMessage] = useState('')
  const [timeLeft, setTimeLeft] = useState(OTP_EXPIRATION)
  const [totalTimeLeft, setTotalTimeLeft] = useState(OTP_EXPIRATION)
  const [showCloseBtn, setShowCloseBtn] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [attempts, setAttempts] = useState(0)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const resendTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // --- Cleanup ---
  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    if (resendTimerRef.current) clearInterval(resendTimerRef.current)
  }, [])

  // --- Request OTP on open ---
  const requestOTP = useCallback(async () => {
    setStage('sending')
    setMessage('')
    setCode('')
    setShowCloseBtn(false)
    setAttempts(0)

    const result = await otpService.requestOTP(respondentId)

    if (result.success) {
      setStage('input')
      const newTimeLeft = result.expiresIn ?? OTP_EXPIRATION
      setTimeLeft(newTimeLeft)
      setTotalTimeLeft(newTimeLeft)

      if (result.remainingSeconds) {
        setResendCooldown(result.remainingSeconds)
        resendTimerRef.current = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              if (resendTimerRef.current) clearInterval(resendTimerRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }

      // Start expiration countdown
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setStage('error')
            setMessage('El código ha expirado. Puedes solicitar uno nuevo.')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Show close button after 30 seconds
      closeTimerRef.current = setTimeout(() => {
        setShowCloseBtn(true)
      }, CLOSE_BUTTON_DELAY * 1000)

      // Focus input
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      // If rate-limited, still show input but with resend cooldown
      if (result.remainingSeconds) {
        setStage('input')
        setResendCooldown(result.remainingSeconds)
        setShowCloseBtn(true)
        setMessage('Ya se envió un código previamente. Puedes ingresarlo o esperar para solicitar uno nuevo.')

        // Start resend cooldown timer
        resendTimerRef.current = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              if (resendTimerRef.current) clearInterval(resendTimerRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        setTimeout(() => inputRef.current?.focus(), 100)
      } else {
        setStage('error')
        setMessage(result.message)
        setShowCloseBtn(true)
      }
    }
  }, [respondentId])

  useEffect(() => {
    if (isOpen && respondentId) {
      requestOTP()
    }
    return clearTimers
  }, [isOpen, respondentId, requestOTP, clearTimers])

  // --- Resend OTP ---
  const handleResend = async () => {
    clearTimers()

    // Set a very short cooldown while we wait for backend 
    // or we could just use a loading state but stage is already enough here if we want
    // But since the button is disabled while cooldown > 0, let's just wait for response.
    // Instead of premature setting, let's fetch first.
    // Temporarily set cooldown to 5 seconds to prevent spam while waiting
    setResendCooldown(5)

    const result = await otpService.requestOTP(respondentId)

    // Clear the temp cooldown timer if we had one, but we didn't start one yet.
    if (result.success) {
      setStage('input')
      setCode('')
      setMessage('¡Listo! Te enviamos un nuevo código.')
      const newTimeLeft = result.expiresIn ?? OTP_EXPIRATION
      setTimeLeft(newTimeLeft)
      setTotalTimeLeft(newTimeLeft)

      const newCooldown = result.remainingSeconds ?? RESEND_COOLDOWN
      setResendCooldown(newCooldown)

      resendTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (resendTimerRef.current) clearInterval(resendTimerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setStage('error')
            setMessage('El código ha expirado. Puedes solicitar uno nuevo.')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setMessage(result.message)
    }
  }

  // --- Verify code ---
  const handleVerify = async () => {
    if (code.length !== 6) return

    setStage('verifying')
    setMessage('')

    const result = await otpService.verifyOTP(respondentId, code)

    if (result.success) {
      clearTimers()
      setStage('verified')
      setMessage('¡Verificación exitosa!')
      setTimeout(onVerified, 800)
    } else {
      setStage('input')
      setAttempts((prev) => prev + 1)
      setMessage(result.message)
      setCode('')

      if (result.remainingAttempts !== undefined && result.remainingAttempts <= 0) {
        setStage('error')
        setMessage('Se agotaron los intentos. Puedes solicitar un nuevo código.')
      }

      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // --- Handle input change ---
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCode(value)
  }

  // --- Handle Enter key ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.length === 6 && stage === 'input') {
      handleVerify()
    }
  }

  // --- Format timer ---
  const formatTime = (seconds: number): string => {
    const totalSeconds = Math.max(0, Math.floor(seconds))
    if (!isFinite(totalSeconds)) return '0:00'
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  const progressPercent = (timeLeft / totalTimeLeft) * 100
  const isLowTime = timeLeft < 60

  return (
    <div className="otp-modal-overlay">
      <div className="otp-modal">
        {/* Header */}
        <div className="otp-modal__header">
          <h2 className="otp-modal__title">
            {isFinalizing ? '⏳ Guardando...' : stage === 'verified' ? '✓ Verificado' : '🔐 Verificación por SMS'}
          </h2>
          <p className="otp-modal__subtitle">
            {isFinalizing
              ? 'Por favor espera mientras finalizamos el proceso.'
              : stage === 'sending'
                ? 'Enviando código de verificación a tu teléfono...'
                : stage === 'verified'
                  ? 'La información ha sido validada correctamente.'
                  : `Hemos enviado un código de 6 dígitos al número ${phoneNumber}. Ingrésalo a continuación.`}
          </p>
        </div>

        {isFinalizing ? (
          <div className="otp-modal__form" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div className="otp-modal__spinner" />
            <p style={{ marginTop: '1rem', color: '#666', fontWeight: 500 }}>Terminando de guardar la encuesta...</p>
          </div>
        ) : (
          <>
            {/* Sending state */}
            {stage === 'sending' && (
              <div className="otp-modal__form" style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="otp-modal__spinner" />
                <p style={{ marginTop: '1rem', color: '#666' }}>Enviando mensaje de texto...</p>
              </div>
            )}

            {/* Input / Verifying state */}
            {(stage === 'input' || stage === 'verifying') && (
              <div className="otp-modal__form">
                <div className="otp-modal__input-group">
                  <label className="otp-modal__label">Código de verificación</label>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    className="otp-modal__input"
                    value={code}
                    onChange={handleCodeChange}
                    onKeyDown={handleKeyDown}
                    placeholder="000000"
                    maxLength={6}
                    disabled={stage === 'verifying'}
                    autoComplete="one-time-code"
                  />
                  <p className="otp-modal__hint">Código de 6 dígitos</p>
                </div>

                {/* Timer */}
                {timeLeft > 0 && (
                  <div className="otp-modal__timer">
                    <div className="otp-modal__progress">
                      <div
                        className="otp-modal__progress-bar"
                        style={{
                          width: `${progressPercent}%`,
                          background: isLowTime ? '#e74c3c' : '#4a7c6f',
                        }}
                      />
                    </div>
                    <div className="otp-modal__timer-text">
                      <span>Tiempo restante</span>
                      <span
                        className={`otp-modal__timer-value${isLowTime ? ' otp-modal__timer-value--warning' : ''}`}
                      >
                        {formatTime(timeLeft)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Message */}
                {message && (
                  <div className="otp-modal__warning">{message}</div>
                )}

                {/* Attempt counter */}
                {attempts >= 2 && (
                  <div className="otp-modal__warning">
                    {`Llevas ${attempts} intentos fallidos. Revisa el mensaje de texto que recibiste.`}
                  </div>
                )}

                {/* Verify button */}
                <button
                  className="btn btn--primary otp-modal__verify-btn"
                  onClick={handleVerify}
                  disabled={code.length !== 6 || stage === 'verifying'}
                >
                  {stage === 'verifying' ? 'Verificando...' : 'Confirmar código'}
                </button>

                {/* Resend */}
                <div className="otp-modal__actions">
                  <button
                    className="btn btn--secondary otp-modal__resend-btn"
                    onClick={handleResend}
                    disabled={timeLeft > 0 || resendCooldown > 0}
                  >
                    {timeLeft > 0
                      ? `Reenviar código (${formatTime(timeLeft)})`
                      : resendCooldown > 0
                        ? `Reenviar código (${formatTime(resendCooldown)})`
                        : 'Reenviar código'}
                  </button>

                  {/* Close button - appears after 30 seconds */}
                  {showCloseBtn && !allowSkip && (
                    <button
                      className="btn otp-modal__cancel-btn"
                      onClick={onClose}
                    >
                      Continuar sin verificación
                    </button>
                  )}

                  {/* Skip button - always visible when configured */}
                  {allowSkip && (
                    <button
                      className="btn otp-modal__bypass-btn"
                      onClick={onClose}
                    >
                      Continuar sin verificación
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Verified state */}
            {stage === 'verified' && (
              <div className="otp-modal__form" style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p style={{ color: '#4a7c6f', fontWeight: 600 }}>{message}</p>
              </div>
            )}

            {/* Error state */}
            {stage === 'error' && (
              <div className="otp-modal__form">
                {message && <div className="otp-modal__warning">{message}</div>}
                <div className="otp-modal__actions" style={{ marginTop: '1rem' }}>
                  <button
                    className="btn btn--secondary otp-modal__resend-btn"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || timeLeft > 0}
                  >
                    {resendCooldown > 0 || timeLeft > 0
                      ? `Reenviar código (${formatTime(Math.max(timeLeft, resendCooldown))})`
                      : 'Solicitar nuevo código'}
                  </button>
                  <button
                    className="btn otp-modal__cancel-btn"
                    onClick={onClose}
                  >
                    Continuar sin verificación
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default OTPModal
