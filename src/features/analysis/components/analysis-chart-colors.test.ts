import { describe, expect, it } from 'vitest'

import { analysisChartColors } from './analysis-chart-colors'

describe('analysis chart colors', () => {
  it('uses the shared chart palette in rank order with a muted fallback', () => {
    expect(analysisChartColors).toEqual([
      'var(--chart-1)',
      'var(--chart-2)',
      'var(--chart-3)',
      'var(--chart-4)',
      'var(--chart-5)',
      'var(--muted-foreground)',
    ])
  })

})
