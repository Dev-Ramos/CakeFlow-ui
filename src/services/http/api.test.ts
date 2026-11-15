import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { server } from '@/test/server'
import { api } from './api'
import { ApiError } from './errors'
import { setAccessTokenGetter, setUnauthorizedHandler } from './interceptors'

const url = (path: string) => `http://localhost:3000${path}`

describe('api', () => {
  it('normaliza erros HTTP em ApiError preservando status e corpo', async () => {
    server.use(
      http.get(url('/x'), () =>
        HttpResponse.json({ message: 'Falhou' }, { status: 422 }),
      ),
    )
    const error = await api.get('/x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 422,
      message: 'Falhou',
      data: { message: 'Falhou' },
    })
  })

  it('envia o token e aciona o handler de 401', async () => {
    let auth: string | null = null
    server.use(
      http.get(url('/me'), ({ request }) => {
        auth = request.headers.get('authorization')
        return new HttpResponse(null, { status: 401 })
      }),
    )
    const onUnauthorized = vi.fn()
    setAccessTokenGetter(() => 'abc')
    setUnauthorizedHandler(onUnauthorized)

    await api.get('/me').catch(() => undefined)

    expect(auth).toBe('Bearer abc')
    expect(onUnauthorized).toHaveBeenCalledOnce()

    setAccessTokenGetter(() => null)
    setUnauthorizedHandler(null)
  })

  it('não aciona o handler quando skipUnauthorizedHandler está ativo', async () => {
    server.use(http.post(url('/login'), () => new HttpResponse(null, { status: 401 })))
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)

    await api.post('/login', {}, { skipUnauthorizedHandler: true }).catch(() => undefined)

    expect(onUnauthorized).not.toHaveBeenCalled()
    setUnauthorizedHandler(null)
  })
})
