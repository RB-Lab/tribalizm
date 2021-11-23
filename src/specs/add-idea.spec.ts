import { AddIdea, NewIdeaMessage } from '../use-cases/add-idea'
import { Brainstorm, IQuestIdea } from '../use-cases/entities/brainstorm'
import { Member } from '../use-cases/entities/member'
import { NotYourTribe } from '../use-cases/utils/not-your-tribe'
import { createContext } from './test-context'

describe('Add idea', () => {
    it('adds idea', async () => {
        const world = await setUp()
        await world.ideasAdder.addIdea(world.defReq)
        const ideas = await world.ideaStore.find({})
        expect(ideas.length).toEqual(1)
        expect(ideas[0]).toEqual(
            jasmine.objectContaining<IQuestIdea>(world.defReq)
        )
    })
    it('notifies all members except author', async () => {
        const world = await setUp()
        const onIdea = world.spyOnMessage<NewIdeaMessage>('new-idea-added')
        await world.ideasAdder.addIdea(world.defReq)
        expect(onIdea).toHaveBeenCalledTimes(world.members.length - 1)
        expect(onIdea).toHaveBeenCalledWith(
            jasmine.objectContaining<NewIdeaMessage>({
                type: 'new-idea-added',
                payload: {
                    targetUserId: world.members[0].userId,
                    description: world.defReq.description,
                    targetMemberId: world.members[0].id,
                },
            })
        )
        expect(onIdea).not.toHaveBeenCalledWith(
            jasmine.objectContaining<NewIdeaMessage>({
                payload: {
                    targetUserId: world.members[0].userId,
                    description: world.defReq.description,
                    targetMemberId: world.defReq.meberId,
                },
            })
        )
    })
    it('skips candidates', async () => {
        const world = await setUp()
        await world.memberStore.save({ ...world.members[1], isCandidate: true })
        const onIdea = world.spyOnMessage<NewIdeaMessage>('new-idea-added')
        await world.ideasAdder.addIdea(world.defReq)
        expect(onIdea).not.toHaveBeenCalledWith(
            jasmine.objectContaining<NewIdeaMessage>({
                payload: {
                    targetUserId: world.members[0].userId,
                    description: world.defReq.description,
                    targetMemberId: world.members[1].id,
                },
            })
        )
    })
    it('FAILs to add it, if member is not from the tribe', async () => {
        const world = await setUp()
        const member = await world.memberStore.save(
            new Member({
                tribeId: 'other',
                userId: 'user',
            })
        )
        await expectAsync(
            world.ideasAdder.addIdea({ ...world.defReq, meberId: member.id })
        ).toBeRejectedWithError(NotYourTribe)
    })
})

async function setUp() {
    const context = await createContext()
    const { tribe, members } = await context.testing.makeTribe()
    const brainstorm = await context.stores.brainstormStore.save(
        new Brainstorm({
            time: Date.now(),
            tribeId: tribe.id,
        })
    )

    const ideasAdder = new AddIdea(context)

    const defReq = {
        brainstormId: brainstorm.id,
        description: 'Lets OLOLO!',
        meberId: members[3].id,
    }
    return {
        ideasAdder,
        brainstorm,
        tribe,
        members,
        defReq,
        ...context.stores,
        spyOnMessage: context.testing.spyOnMessage,
    }
}
