import { SavedMember } from './entities/member'

export function getBestFreeMember(
    members: SavedMember[],
    trait: 'charisma' | 'wisdom',
    activeQuests: Record<string, number>,
    exclude: string[]
) {
    const freeMembersSorted = members
        .slice()
        .sort((a, b) => b[trait] - a[trait])
        .filter((m) => {
            if (exclude.includes(m.id)) return false
            return (activeQuests[m.id] || 0) <= minQuests(activeQuests)
        })
    if (!freeMembersSorted.length) {
        throw new Error(
            `Cannot assign quest: not enoug members (${members.length})`
        )
    }
    const counterpart = trait === 'charisma' ? 'wisdom' : 'charisma'
    const candidate = freeMembersSorted.find((m) => m[trait] >= m[counterpart])
    return candidate ? candidate : freeMembersSorted[0]
}
export function minQuests(activeQuests: { [id: string]: number }) {
    const counts = Object.values(activeQuests)
    return counts.length ? Math.min(...counts) || 0 : 0
}
