## Roles

-   User – a user that is not a member of the tribe
-   Member – User's role in tribe
-   Candidate member – a member of a tribe that is not accepted yet
-   Quest head (Idea starter)
-   Admin
-   System – checks that run on timers
-   Developer

## Use Cases

❗️ – must, ❓ – must check, ❕– should, ✅ – done

1.  ✅ A _user_ gets request share their location via coordinates or via text
2.  ✅ A _user_ looks through the list of available _tribes_ to find one to join
3.  ✅ A _user_ looks in _astral_ if there is no local tribe
4.  ✅ A _user_ creates an _astral_ tribe if they didn't find any suitable tribe
5.  ❕ A _user_ searches available _tribes_ to find one to join
6.  ✅ A _user_ views a _tribe_ info to decide if they want to join
7.  ❗️ An _astral tribe_ gets incarnated in city as soon as there 5 (or 3?) members
8.  Initiation
    1. ✅ A _user_ fills an _application_ to join a _tribe_
    2. ✅ A randomly chosen _member_ receives _candidate members_ _application_ and requests the
       _initiation quest_ with proposed date and place
    3. ❕ A _member_ views _users_ profile
    4. ✅ A _candidate member_ gets quest proposal and can accept it or propose another date/place
    5. ✅ A _(candidate) member_ gets notified that quest accepted
    6. ✅ A _member_ approves or declines _application_,
    7. ✅ A next _member_ is randomly chosen and the process repeats 2 times (3 member in total). It
       is enough 1 decline to decline candidate. It is needed 3 approves to approve a candidate
9.  Brainstorm
    1.  ❕ The _system_ gathers a _brainstorm_ when there is not very much ongoing quests left (e.g.
        < 20% members)
    2.  ✅ The _admin_ gathers a _brainstorm_
    3.  ✅ A _member_ gets notification about declared _brainstorm_ (note: skip _candidates_)
    4.  ✅ A _member_ gets invite to just started _brainstorm_
    5.  ✅ A _member_ adds a _quest idea_
    6.  ✅ The _system_ transitions _brainstorm_ to voting state
    7.  ✅ A _member_ vote for a _quest idea_
    8.  ✅ The _system_ transitions _brainstorm_ to finished state
10. Coordination
    1.  ✅ The _system_ makes a coordination _quest_ from popular _quest ideas_ and assigns it to
        idea starter and a random _member_; it balances amount of assigned quests; it assign quest
        without date and place than 200 members)
    2.  ✅ A _member_ creates a sub-quest, edits its description
    3.  ✅ The _system_ assigns sub-quest to one of up-voted _member_
    4.  ✅ A _member_ rejects _quest_ (except initiation)
    5.  ✅ A _member_ declares _gathering_; all members of the tribe or all upwoters are notified
        about time, place and theme of the gathering
    6.  ✅ A _member_ creates a re-quest (repeat of the same quest) if more discussion is needed
    7.  ❕ A _member_ who made a coordination _sub-quest_ may request a kick-off quest
    8.  ❕ A _member_ who made a coordination _sub-quest_ may request a report on its completion
    9.  ❕ The _system_ makes a report _quest_ when coordination _sub-quest_ is over
    10. ✅ The _system_ reassigns rejected _quest_ to another member (see use-cases 10.1 & 10.3)
11. ✅ The _system_ makes an introduction _quest_ and assigns it to those pair of members that never
    had one (nor they have an initiation quests)
12. ❕ A _member_ fucks up a _quest_ (i.e. quest is not done) and want to re-negotiate it
13. ❕ A _member_ wants to leave the game
14. ❕ A _member_ wants to be notified about the quest the day before it appointed (or other
    time period? or add to calendar)
15. ❕ A _tribe chief_ wants to rename tribe and change description
16. ❕ A _member_ wants to list all their quests

Done: 26, In progress: 0, Must: 1, Must check: 0, Should: 11, total: 37

### Tribes incarnation & astral

-   When user is in city C and that city has tribe T incarnation TC in user's tribe list only TC is
    shown
-   When in astral not enough users to initiate new one, random users from incarnated tribes are
    borrowed
-   When in C incarnates T all T members in C added to TC. In T those members are 'on hold'.
-   When in C new user joined TC it also joined T but 'on hold'
-   When users leave C and TC has not enough members, T members of city C are now not 'on hold', but
    TC's members now 'on hold'
-

## Entities

-   \[System\] (Tasks, Dispatcher, Scheduler, Bus)
-   City
-   User (id, name, city, timezone)
-   Tribe (name, description, logo, city, astralParent)
-   Quest (type (coordination/initiation/introduction/execution), status
    (accepted/proposed/declined/done) description, date, place, assigned members)
-   Gathering
-   Application (user, reason)
-   Member (user, tribe, charisma, wisdom)
-   Brainstorm (id, date, duration(=10min), state)
-   Quest idea (description, votes(member, up|down))

## BACKLOG

### Design

-   Fault tolerance: resurrect system from persisted state
-   Reliability: use transactions in when update stores
-   Use view-model: intermediate layer for simple entity queries: thus notifications etc. could have
    absolute minimal data and view could get what they need from view-models. In theory this will
    lead to less modifications in business logic & tests.
-   Use yarn workspaces & move business logic to a separate "package"?

#### Ideas

-   Maybe it would be better to create a Tribalizm instance on each request (including request from
    scheduler). This will allow to:
    -   Use cache in ContextUser saving all query results just in memory
    -   Store in memory all traces and warnings and dump them when error happens
    -   We can use lazy initialization of UseCases via `get` methods

### UX

1.  What to do when a user logs-in with new coordinates...
2.  What if several tribes have a brainstorm at the same time (for one user)
3.  How to list user's own tribes?
4.  List of user's tasks, incl. current one
5.  Forbid to spawn/gather before coordination quest started?
6.  What if user ignores bot messages, esp. intro & init quests?
7.  What if user leaves their area temporary, or temporary get's in other area and became chief
    there?
8.  Re-voting for ideas in TG is kinda hard to do (no disabled buttons)
9.  consider this: we have 10 members tribe, three of them suggest 9 ideas (3 each) and up-vote all 9. Thus we will have 5 quests assigned between these 3 members (each have 3-4) while other 7
    passive tribesmen won't have any. ┐( ˘_˘)┌ maybe that's OK.

## TODO

-   fix timezones for 30 cities. Preserve IDs, because there are users linked to those cities already
-   DROP chiefs/shamans & ratings
