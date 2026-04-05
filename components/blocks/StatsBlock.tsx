import type { StatsBlock as StatsBlockType } from '@/types/cms'
import { StatsBar } from '@/components/sections/StatsBar'

export default function StatsBlock({ stats, background }: StatsBlockType) {
  return (
    <div data-component="stats-block">
      <StatsBar stats={stats} background={background ?? 'gray'} />
    </div>
  )
}
