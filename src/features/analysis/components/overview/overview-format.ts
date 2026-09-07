import { formatPercent } from '../../model/analysis-overview'

export function formatSignedPercent(value: number) {
  if (value === 0) {
    return '±0.0%'
  }
  return `${value > 0 ? '+' : ''}${formatPercent(value)}`
}
