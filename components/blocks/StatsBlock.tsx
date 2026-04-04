import type { StatsBlock as StatsBlockType } from '@/types/cms'
import { StatsBar } from '@/components/sections/StatsBar'

export default function StatsBlock({ stats, background }: StatsBlockType) {
  return <StatsBar stats={stats} background={background ?? 'gray'} />
}
