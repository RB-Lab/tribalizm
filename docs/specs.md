## Roles

-   Member
-   Cheif
-   Shaman
-   Quest head
-   Stranger – a user that is not a member of the tribe
-   Admin
-   Developer

## Use Cases

1.  ❕ A _stranger_ looks through the list of available _tribes_ to find one to join
2.  ❕ A _stranger_ gets request to set their city whne they don't want to share coordinates
3.  ❕ A _stranger_ searches available _tribes_ to find one to join
4.  ❗ A _stranger_ views a _tribe_ info to decide if they want join
5.  ❗ A _stranger_ views a _tribe_ info by a link to that tribe
6.  ❕ A _stranger_ gets proposal to start a _tribe chapter_ when they open link to the tribe not in
    their area
7.  ❗ A _stranger_ becames _user_
8.  ✅ A _user_ fills an _application_ to join a _tribe_
9.  ✅ A _tribe cheif_ gets _users_ _application_ and requests the _initiation quest_ with
    proposed date and place
10. ❕ A _tribe cheif_ views _user_
11. ✅ A _user_ gets quest proposal and can accept it or propose another date/place
12. ✅ A _user_ gets notified that quest accepted
13. ✅ A _tribe cheif or shaman_ approves or declines _application_,
14. ✅ A _tribe shaman_ gets _users_ _application_ accepted by the _cheif_ and requests the
    second _initiation quest_ with proposed date and place
15. ❗ An _admin_ adds a new tribe
16. ❗ An _admin_ adds member to a tribe and set their charisma and wisdom scores
17. ❗ An _admin_ adds a _union_ and associate some _tribes_ with it
18. ❕ A trusted _user_ starts their own tribe
19. ❗ An _admin_ notifies a _cheif_ that it is time to gather a _brainstorm_
20. ❕ The _system_ notifies a _cheif_ that it is time to gather a _brainstorm_ when there is not very
    much ongoing quests left (e.g. < 20% members)
21. 🔜 A _tribe cheif_ declares a _brainstorm_ date
22. ❗ A _member_ gets notification about declared _brainstorm_ (note: skip candidates)
23. ❗ A _member_ gets invite to just started _brainstorm_
24. ❗ A _member_ adds a _quest idea_
25. ❗ The _system_ transitions _brainstorm_ to voting state
26. ✅ A _member_ vote for a _quest idea_
27. ❗ The _system_ transitions _brainstorm_ to finished state
28. ✅ The _system_ makes a coordintation _quest_ from popular _quest ideas_ and assigns it to entry
    starter and most charismatic or most wise up-voted _member_; it balances amount of assigned
    quests; 😕❓ it uses random noise; it assign quest without date and place
29. ❕ The _system_ notifies a _cheif_ that it is time to divide a tribe in two (when there is more
    than 200 memebers)
30. ✅ A _member_ creates a sub-quest, edits its description
31. ✅ The _system_ assigns sub-quest to one of upvoted _member_
32. ✅ A _member_ declares _gathering_; all memebers of the tribe or all upwoters are notified about
    time, place and theme of the gathering
33. ✅ A _member_ creates a re-quest (repeat of the same quest)
34. ❗ The _system_ makes an introduction _quest_ and assigns it to those pair of members that never
    had one
35. ❕ A _member_ who made a coordination _sub-quest_ may request a report on its completion
36. ❕ The _system_ makes a report _quest_ when coordination _sub-quest_ is over
37. ❗ The _system_ asks on "how was the quest"
    -   two hours after initiation/introduction quests
    -   five hours after coordination quest (or next morning, if after 21)
    -   next day morning after _gathering_
38. ❕ A _member_ fucks up a _quest_ (i.e. quest is not done) and want to re-negotiate it
39. ✅ A _member_ casts scores for _gathering_
40. ✅ A _member_ casts scores for introduction and coordination quests: charisma and wisdom of the
    counterpart. These scroes are being applied to counterpart's scores as soon, as they have 5
    scores casted
41. ✅ A _shaman_, _chief_, and new _member_ cast their scores on initiation quests. Those also will be
    applied only when %5=0
42. ✅ A _member_ sets scores for _gathering_: its awesomness, this score propagates to
    charisma of those who participated on coordination of this _quest_
    -   NOTE: not all quests have execution qust at the end
43. ❕ A _tribe cheif_ deligates their responsibilitis to any _member_ with _trust_
44. ✅ A score for _gathering_ is applied to all organizing _members_ charisma immediately
45. ✅ A score casted by another _member_ ia applied to _member_ charisma & wisdom after each 5 votes
46. ✅ A _member_ rejects _quest_ (except initiation)
47. ✅ The _system_ reassigns rejected _quest_ to antoter member (see usecases 26 & 29)
48. ❗ The _system_ makes most charismatic member tribes _chief_
49. ❗ The _system_ makes most wise member tribes _shaman_
50. ❕ A _member_ wants to leave the game (inc. _chief_ and _shaman_)
51. ❕ TODO When a user logs-in with new coordinates...
52. ❕ A _member_ wants to be notified about the quest the day before it appointed (or other time
    period? or add to calendar)

Done: 20, In porgres: 1, Must: 16, Should: 15, total: 52

## Entities

-   System (?????)
-   Location (coordinates, radius, parent location)
-   User (id, /tg-name/, members, location)
-   Tribe (name, description, logo, vocabulary (tribe/club/order/ligue/church), members, cheif,
    shaman, union, location)
-   Union (id, name?, logo?)
-   Quest (type (coordination/initiation/introduction/execution), status
    (accepted/proposed/declined/done) description, date, place, assigned members)
-   Gathering
-   Application (user, reason)
-   Member (user, tribe, charisma, wisdom)
-   Brainstorm (id, date, duration(=10min), state)
-   Quest idea (description, votes(member, up|down))
-   Score
    -   Quest score (caster, quest, score)
    -   Charisma score (caster, member, score)
    -   Wisdome score (caster, member, score)

## TODO design

-   Fault tolerance: resurect system from persisted state
