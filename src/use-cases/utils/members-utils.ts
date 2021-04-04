import { SavedMember } from '../entities/member'

export function getBestFreeMember(
    members: SavedMember[],
    trait: Trait,
    activeQuests: Record<string, number>,
    exclude: string[]
) {
    const freeMembersSorted = members
        .slice()
        .sort((a, b) => b[trait] - a[trait])
        .filter((m) => {
            if (exclude.includes(m.id)) return false
            return (activeQuests[m.id] || 0) <= minQuests(activeQuests, exclude)
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
export function minQuests(
    activeQuests: { [id: string]: number },
    exclude: string[] = []
) {
    const counts = Object.entries(activeQuests).reduce<number[]>(
        (res, [id, count]) => (exclude.includes(id) ? res : [...res, count]),
        []
    )
    return counts.length ? Math.min(...counts) || 0 : 0
}

type Trait = 'charisma' | 'wisdom'

export function findMaxTrait(members: SavedMember[], trait: Trait) {
    let member = members[0]
    members.forEach((m) => {
        if (member[trait] < m[trait]) {
            member = m
        }
    })
    return member
}
