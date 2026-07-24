import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock puppeteer before importing the module under test, so PDFGenerator never
// launches a real Chrome. Only launch() is used by the code paths under test.
vi.mock('puppeteer', () => ({
  default: { launch: vi.fn() },
}))

// launchBrowser() probes for a system Chrome via `await import('fs')`. Mock it
// so the fallback test is deterministic regardless of what's installed. The
// module reads photos through 'fs/promises', which is untouched here.
vi.mock('fs', () => ({
  existsSync: vi.fn(() => true),
  default: { existsSync: vi.fn(() => true) },
}))

import puppeteer from 'puppeteer'
import { PDFGenerator, withTimeout } from '../../src/lib/pdf-generator'

const launch = (puppeteer as unknown as { launch: ReturnType<typeof vi.fn> })
  .launch

/**
 * Minimal stand-in for a Puppeteer Browser. `connected` is mutable so a test
 * can simulate the browser wedging, and disconnected listeners can be fired
 * with emit() to simulate Chrome dying underneath us.
 */
function makeFakeBrowser() {
  const listeners: Record<string, Array<() => void>> = {}
  return {
    connected: true,
    on: vi.fn((event: string, cb: () => void) => {
      ;(listeners[event] ||= []).push(cb)
    }),
    close: vi.fn().mockResolvedValue(undefined),
    newPage: vi.fn(),
    emit(event: string) {
      ;(listeners[event] || []).forEach((cb) => cb())
    },
  }
}

describe('withTimeout', () => {
  it('resolves with the value when the promise settles in time', async () => {
    await expect(withTimeout(Promise.resolve(42), 1000, 'fast')).resolves.toBe(
      42,
    )
  })

  it('propagates the underlying rejection unchanged', async () => {
    const boom = new Error('boom')
    await expect(
      withTimeout(Promise.reject(boom), 1000, 'reject'),
    ).rejects.toBe(boom)
  })

  it('rejects with a timeout error when the promise never settles', async () => {
    // A Promise that never resolves — exactly what a wedged page op looks like.
    await expect(
      withTimeout(new Promise<never>(() => {}), 20, 'stuck'),
    ).rejects.toThrow(/timed out after 20ms: stuck/)
  })
})

describe('PDFGenerator browser lifecycle', () => {
  const created: ReturnType<typeof makeFakeBrowser>[] = []

  beforeEach(() => {
    created.length = 0
    launch.mockReset()
    launch.mockImplementation(() => {
      const browser = makeFakeBrowser()
      created.push(browser)
      return Promise.resolve(browser)
    })
  })

  it('launches once and reuses a still-connected browser', async () => {
    const gen = new PDFGenerator()

    await gen.initialize()
    await gen.initialize()

    // Second call sees connected === true and does not relaunch.
    expect(launch).toHaveBeenCalledTimes(1)
    expect(created[0].on).toHaveBeenCalledWith(
      'disconnected',
      expect.any(Function),
    )
  })

  it('relaunches (and discards the old browser) when the handle is disconnected', async () => {
    const gen = new PDFGenerator()

    await gen.initialize()
    // Simulate the browser wedging: still held, but no longer connected.
    created[0].connected = false
    await gen.initialize()

    expect(launch).toHaveBeenCalledTimes(2)
    // The dead handle is torn down, not leaked.
    expect(created[0].close).toHaveBeenCalledTimes(1)
  })

  it('nulls the handle on the disconnected event so the next render relaunches', async () => {
    const gen = new PDFGenerator()

    await gen.initialize()
    // Chrome dies underneath us; the listener should forget the handle.
    created[0].emit('disconnected')
    await gen.initialize()

    expect(launch).toHaveBeenCalledTimes(2)
    // Handle was already nulled by the event, so no redundant close() call.
    expect(created[0].close).not.toHaveBeenCalled()
  })

  it('falls back to system Chrome when the bundled browser fails to launch', async () => {
    const gen = new PDFGenerator()

    // First launch (bundled, no executablePath) throws; second (system) works.
    launch.mockReset()
    launch
      .mockRejectedValueOnce(new Error('bundled failed'))
      .mockImplementationOnce(() => Promise.resolve(makeFakeBrowser()))

    await gen.initialize()

    expect(launch).toHaveBeenCalledTimes(2)
    // Bundled attempt omits executablePath; fallback supplies one.
    expect(launch.mock.calls[0][0]).not.toHaveProperty('executablePath')
    expect(launch.mock.calls[1][0]).toHaveProperty('executablePath')
  })
})
