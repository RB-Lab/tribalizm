# 1. Get into tribe

## World

-   City Novosibirsk
-   Tribes:
    -   Foo Tribe,
    -   Bar Tribe
-   Users:
    -   New User
    -   Old member 1
    -   Old member 2
    -   Old member 3
    -   Old member 4
    -   Old member 5

## ✅ Main scenario

-   _New User_
    -   ← /start's the bot
    -   → `List tribes`, `Rules`
    -   ← List tribes
    -   → Enter your location `Share location`
    -   ← "Novosibirsk"
    -   → tribes list: Foo Tribe `Apply` Bar Tribe `Apply`
    -   ← Apply Bar Tribe
    -   → Provide cover letter
    -   ← "I want to BARRR!"
    -   → Application has been sent
-   _Bar Tribe Old member 1_
    -   → New application! (cover letter) `Accept`
    -   ← Accept
    -   → Enter date `...calendar...`
    -   ← 12/05/2022
    -   → Enter hours `9...21`
    -   ← 12
    -   → Enter minutes `00, 15, 30, 45`
    -   ← 45
    -   → Enter place
    -   ← "Barr Bar"
    -   → Ok, you proposed 12/05/2022, 12:45, in Barr Bar `Yes`, `Change`
    -   ← Yes
    -   → Ok, candidate has been informed
-   _New User_
    -   → Bar Tribe member Oldie proposed to meet 12/05/2022, 12:45, in Barr Bar `Agree`, `Change`
    -   ← Change
    -   → Enter date `...calendar...`
    -   ← 14/05/2022
    -   → Enter hours `9...21`
    -   ← 20
    -   → Enter minutes `00, 15, 30, 45`
    -   ← 00
    -   → Enter place
    -   ← "Barr Bar"
    -   → Ok, you proposed 14/05/2022, 20:00, in Barr Bar `Yes`, `Change`
    -   ← Yes
    -   → Ok, Oldie has been informed
-   _Bar Tribe Old member 1_
    -   → Candidate proposed to meet 14/05/2022, 20:00, in Barr Bar `Agree`, `Change`
    -   ← Agree
    -   → Ok, candidate has been informed
-   _New User_
    -   → Bar Tribe member Oldie agreed on your proposal, you're meeting 14/05/2022, 20:00, in Barr Bar, Don't be late! 😉

### Some time after

-   _Bar Tribe Old member 1_
    -   → Do you accept candidate `Yes`, `No`
    -   ← Yes
    -   → Ok, your resolution accounted
-   _Bar Tribe Old member 2_
    -   → New application! (cover letter) `Accept`
    -   ← Accept
    -   → Enter date `...calendar...`
    -   ← 16/05/2022
    -   → Enter hours `9...21`
    -   ← 20
    -   → Enter minutes `00, 15, 30, 45`
    -   ← 00
    -   → Enter place
    -   ← "Barr Bar"
    -   → Ok, you proposed 16/05/2022, 20:00, in Barr Bar `Yes`, `Change`
    -   ← Yes
    -   → Ok, candidate has been informed
-   _New User_
    -   → Bar Tribe member Oldie2 proposed to meet 16/05/2022, 20:00, in Barr Bar `Agree`, `Change`
    -   ← Agree
    -   → Ok, you're meeting with Oldie2 16/05/2022, 20:00, in Barr Bar. Don't be late! 😉
-   _Bar Tribe Old member 2_
    -   → Candidate agreed with your proposal, you're meeting 16/05/2022, 20:00, in Barr Bar.
-   **Repeat for Old member 3**

### Some time after

-   _Bar Tribe Old member 3_
    -   → Do you accept candidate `Yes`, `No`
    -   ← Yes
    -   → Ok, candidate accepted in tribe!
-   _New User_
    -   → Hooray! You've been accepted in Bar Tribe!! You'll meet with other members soon.
-   _Old member 4_
    -   → New member in Bar Tribe! Let's arrange an introduction meeting!
    -   → Enter date `...calendar...`
    -   ← 20/05/2022
    -   → Enter hours `9...21`
    -   ← 20
    -   → Enter minutes `00, 15, 30, 45`
    -   ← 00
    -   → Enter place
    -   ← "Barr Bar"
    -   → Ok, you proposed 20/05/2022, 20:00, in Barr Bar `Yes`, `Change`
    -   ← Yes
    -   → Ok, new member has been informed
-   _New User_
    -   → Bar Tribe shaman proposed to meet 20/05/2022, 20:00, in Barr Bar `Agree`, `Change`
    -   ← Agree
    -   → Ok, you're meeting with Bar Tribe shaman 20/05/2022, 20:00, in Barr Bar.
-   _Old User 1_
    -   → Newbie agreed with your proposal, you're meeting 20/05/2022, 20:00, in Barr Bar.

### Some time after

-   **Repeat for Old member 3**

## Variations

### Location by coordinates

-   _New User_
    -   ← /start's the bot
    -   → `List tribes`, `Rules`
    -   ← List tribes
    -   → Enter your location `Share location`
    -   ← [...shared location...]
    -   → tribes list: Foo Tribe `Apply` Bar Tribe `Apply`

### ⏳ Some kind of user-facing error...

### ✅ Declined by Oldie 2

[...after first part of initiation...]

-   _Bar Tribe Old user 1_
    -   → Do you accept candidate `Yes`, `No`
    -   ← No
    -   → Ok, I'll inform candidate
-   _New User_
    -   → Sorry, your application has been declined

### ✅ Express initiation (tribe has only one member (thus, astral tribe))

[...after first part of initiation...]

-   _Bar Tribe Old member1_
    -   → Do you accept candidate `Yes`, `No`
    -   ← Yes
    -   → Ok, candidate accepted in tribe!
-   _New User_
    -   → Hooray! You've been accepted in Bar Tribe!! You'll meet with other members soon.
-   _Old member 1_
    -   → New member in Bar Tribe! Let's arrange an introduction meeting!
