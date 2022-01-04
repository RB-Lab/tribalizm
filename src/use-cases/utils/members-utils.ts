import { SavedMember } from '../entities/member'

/**
 * Finds the member with prevailing `trait` (e.g. more charismatic or more wise) that have the least
 * assigned quests
 * @param members members to search from
 * @param trait desired trait
 * @param activeQuests map of member ID to number of quests currently assigned to them
 *                     @see QuestStore.getActiveQuestsCount()
 * @param exclude member IDs to exclude (usually those for whom we search partners)
 * @returns best fitting member
 */
export function getBestFreeMember(
    members: SavedMember[],
    activeQuests: Record<string, number>,
    exclude: string[]
) {
    const freeMembersFiltered = members.slice().filter((m) => {
        if (exclude.includes(m.id)) return false
        return (activeQuests[m.id] || 0) <= minQuests(activeQuests, exclude)
    })
    if (!freeMembersFiltered.length) {
        throw new Error(
            `Cannot assign quest: not enough members (${members.length})`
        )
    }
    // TODO randomize
    return freeMembersFiltered[0]
}
/**
 * Get minimal assigned quests count (e.g. 0 if there is a free member, 1 if at least one quest
 * assigned to any member)
 * @param activeQuests map of member ID to quests currently assigned to them
 *                     @see QuestStore.getActiveQuestsCount()
 * @param exclude member IDs to exclude (usually those for whom we search partners)
 * @returns
 */
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
