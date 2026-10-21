// Static brand artwork is served from public/banks/. No account or database changes.
const brands: { keywords: string[]; key: string; initials: string }[] = [
  { keywords: ['gcash'], key: 'gcash', initials: 'G' },
  { keywords: ['maribank', 'seabank'], key: 'maribank', initials: 'M' },
  { keywords: ['metrobank', 'metropolitan bank'], key: 'metrobank', initials: 'M' },
  { keywords: ['rcbc', 'rizal commercial'], key: 'rcbc', initials: 'R' },
  { keywords: ['security bank'], key: 'securitybank', initials: 'S' },
  { keywords: ['unionbank', 'union bank'], key: 'unionbank', initials: 'U' },
  { keywords: ['gotyme'], key: 'gotyme', initials: 'G' },
  { keywords: ['landbank', 'land bank'], key: 'landbank', initials: 'L' },
  { keywords: ['bdo'], key: 'bdo', initials: 'B' },
  { keywords: ['bpi', 'bank of the philippine islands'], key: 'bpi', initials: 'B' },
  { keywords: ['maya'], key: 'maya', initials: 'M' },
]

export function getBankBrand(name: string) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  const bank = brands.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)))
  return bank ? { src: `/banks/${bank.key}.svg`, initials: bank.initials, label: name }
    : { src: null, initials: name.trim().slice(0, 2).toUpperCase() || '₱', label: name }
}
