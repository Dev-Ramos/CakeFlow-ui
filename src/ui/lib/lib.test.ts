import { describe, expect, it } from 'vitest'
import { cn } from './cn'
import { fold } from './fold'

describe('cn', () => {
  const isHidden = false as boolean
  it('resolve conflitos do Tailwind e classes condicionais', () => {
    expect(cn('p-2', isHidden && 'hidden', 'p-4')).toBe('p-4')
  })
})

describe('fold', () => {
  it('remove acentos e ignora caixa', () => {
    expect(fold('Açúcar Confeiteiro')).toBe('acucar confeiteiro')
  })
})
