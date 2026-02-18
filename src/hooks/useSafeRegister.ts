/**
 * useSafeRegister - Wrapper around react-hook-form's register
 * that guards against the _f ref initialization crash
 * in React 19 + react-hook-form combinations.
 *
 * The issue: RHF's ref callback accesses `field._f` which can be
 * undefined due to React 19's ref-as-prop timing changes.
 * This wrapper catches the error so the field still works via onChange.
 */
import type { UseFormRegister, FieldValues } from 'react-hook-form'

export function useSafeRegister<T extends FieldValues>(register: UseFormRegister<T>): UseFormRegister<T> {
  return ((...args: Parameters<UseFormRegister<T>>) => {
    const registration = register(...args)
    const originalRef = registration.ref

    return {
      ...registration,
      ref: (instance: HTMLElement | null) => {
        try {
          originalRef(instance)
        } catch {
          // Swallow _f initialization error — field tracks via onChange/onBlur
        }
      },
    }
  }) as UseFormRegister<T>
}
