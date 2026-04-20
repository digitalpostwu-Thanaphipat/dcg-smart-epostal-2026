import { describe, it, expect, vi } from 'vitest'
import { haptics } from '../frontend/src/utils/haptics'

describe('Haptics Utility', () => {
  it('should call navigator.vibrate if available', () => {
    const vibrateMock = vi.fn()
    vi.stubGlobal('navigator', { vibrate: vibrateMock })

    haptics.light()
    expect(vibrateMock).toHaveBeenCalledWith(10)

    haptics.medium()
    expect(vibrateMock).toHaveBeenCalledWith(25)

    haptics.heavy()
    expect(vibrateMock).toHaveBeenCalledWith(50)

    haptics.error()
    expect(vibrateMock).toHaveBeenCalledWith([30, 50, 30])
  })

  it('should not throw if navigator is undefined', () => {
    // @ts-ignore
    delete global.navigator
    expect(() => haptics.light()).not.toThrow()
  })
})
