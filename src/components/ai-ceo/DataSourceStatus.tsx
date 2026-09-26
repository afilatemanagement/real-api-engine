export function dataSourceStatus(isPersisted: boolean, liveLabel: string) {
  return isPersisted ? `Live data · ${liveLabel}` : 'Realistic seed · AIRA API offline';
}