import { describe, expect, it } from 'vitest'

import { analysisChartColors } from './analysis-chart-colors'

describe('analysis chart colors', () => {
  it('uses the shared chart palette in rank order with a muted fallback', () => {
    expect(analysisChartColors).toEqual([
      'var(--chart-series-1)',
      'var(--chart-series-2)',
      'var(--chart-series-3)',
      'var(--chart-series-4)',
      'var(--chart-series-5)',
      'var(--muted-foreground)',
    ])
  })

})
