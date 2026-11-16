import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './server'

// jsdom + Radix + MSW são lentos em máquinas modestas: o padrão de 1s para
// findBy*/waitFor gera falhas intermitentes sem indicar bug.
configure({ asyncUtilTimeout: 4000 })

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
