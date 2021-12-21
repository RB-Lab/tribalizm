import type { Translation } from '../i18n-types'

// TODO don't forget to enable this:
const ru: Translation = {
    unhandledText: '🗿 Духи слышат...',
    start: {
        text: 'Присоединись к племени единомышленников в твоём городе',
        buttons: {
            list: 'ℹ️ Список племён',
            rules: '📜 Правила игры',
        },
    },
    rules: {
        buttons: {
            back: '← Назад',
            start: '🚀 Поехали!',
            onBrainstorm: 'Что ещё за мозговой штурм?',
            onQuests: 'Что за квесты?',
            onAstral: 'Что за Астрал?',
            onShaman: 'Кто такой шаман?',
            onChief: 'Кто такой вождь?',
            next: 'И что дальше?',
        },
        apply:
            'Чтобы присоединиться к племени, нужно подать заявку. ' +
            'Вождь и шаман рассмотрят её, и пригласят вас на встречу. ' +
            'Если по итогам этих встреч они решат, что вы хорошо впишетесь в племя, вы к нему присоединитесь.\n' +
            'Если в вашем городе нет интересных племён, загляните в Астрал!',
        onAstral:
            'Астрал – это место, где прибывают "виртуальные" племена. Если в вашем городе недостаточно людей ' +
            'которые разделяют ваши интересы, вы можете найти их в других городах и общатся в видеочатах,' +
            'пока в вашем городе не наберётся достаточно народу. В этот момент племя ждёт инкарнация в реальном мире!',
        onChief:
            'Вождь – это самый харизматичный член племени. Его задача поддерживать дух племени',
        onShaman: 'Шаман – это самый мудрый в племени. Он помогает вождю.',
        inTribe: `Теперь, когда вы вступили в племя, вы можете участвовать в мозговых штурмах и квестах.`,
        onBrainstorm:
            'Во время мозгового штурма все члены племени подкидывают идеи квестов. ' +
            'А потом каждый голосует за квесты по душе. Вас предупредят о следующем мозговом штурме',
        onQuests:
            'Квесты это задачи, которые выполняют члены племени вместе. ' +
            'Это могут быть практические задачи, а могут быть и просто посиделки.',
    },
    tribesList: {
        requestLocationText: 'В каком городе вы находитесь?',
        requestLocation: '🌍 Ок, я тут',
        apply: '🚀 Подать заявку',
        more: 'Подробнее…',
        count: 'Численность:',
        searchIn: 'Племена в городе {city}:',
        searchInAstral: 'Племена в Астрале:',
        applyText:
            'Расскажите вождю и шаману племени о себе и о том, почему вы хотите присоединиться к "{tribe}"',
        applicationSent:
            'Заявка отправлена. Вождь племени скоро предложит встретиться.',
        applicationSentShort: '☑️ OK!',
        cantFindCity: '🤔 Не вижу тут города. Как он называется?',
        unknownCity: '🤔 Не могу найти такой город... Как-как, ещё раз?',
        nothingFound: '💨 В городе {city} пока нет племён...',
        createTribe: '🪄 Создать новое племя',
        searchAstral: 'Заглянуть в Астрал',
        noTribesInAstral: '💨 В Астрале пока нет племён...',
        tribeNamePrompt: 'Как назовём племя?',
        tribeDescriptionPrompt: 'Чем занимается это племя?',
        tribeCreated: '🌅 Новое племя создано.',
        joinLink: 'Присоединиться к племени',
        uploadLogo: 'Пришлите картинку для страницы племени',
        skipImage: '⏩ Без картинки',
        thereMore: 'Есть ещё...',
        loadMore: 'Дальше',
        tribeListEnd: 'Это всё.',
    },
    help: {
        charisma: 'Насколько хороший лидер вышел бы из этого человека',
        wisdom: 'Насколько хорошо этот человек разбирается в главном деле племени',
        unknown: 'Не могу найти справку по этому поводу..',
    },
    elders: {
        chief: 'вождь',
        shaman: 'шаман',
    },

    initiation: {
        declinePrompt: 'Пожалуйста, опишите, почему вы решили отказать?',
        declineOk: 'Хоршо, заявка отклонена',
        approvedOk: 'Отлично, вы одобрили заявку',
        questNotification:
            '{name}, {elder} племени {tribe} предлагает встретиться: \n {proposal}',
        questNotificationForElder:
            '{name}, желающий присоединиться к племени {tribe} предлагает встретиться: \n {proposal}',

        feedbackRequest: 'Как вам {name}? Принимаем его в племя {tribe}?',
        accept: '👍 Да, однозначно!',
        decline: '👎 М.. пожалуй, нет.',
        applicationApproved:
            '🎉 Ура! Вы приняты в племя {tribe}! Вы встретитесь с остальными членами племени в ближайшее время.',
    },
    introduction: {
        newMemberNotice:
            '🎉 В племени {tribe} новый житель, {name}! Нужно запланировать знакомство!',
        okay: '🤗 Давайте же знакомиться!',
        questNotification:
            '{name} из племени {tribe} предлагает встетиться, чтобы познакомиться: \n {proposal}',
    },
    coordination: {
        coordinateOwnIdea: `Нужно скоординировать усили племени, чтобы осужествить задуманное: "{description}". Вам предстоит заняться этим с {name}. Нужно договориться о встрече.`,
        okay: '💪 Нужно! Погнали!',
        questNotification:
            '{name}, житель племени {tribe} предлагает встретиться, чтобы обсудить, что нужно, чтобы "{description}": \n {proposal}',
        coordinateSpawned: `Новое задание: "{description}". Оно поручено вам и {name}. Нужно договориться о встрече`,
        questManage:
            'По результатам встречи с {name}, можно сделать следущюее:',
        buttons: {
            spawn: 'Новое задание',
            gatherUpwoters: 'Собрать заинтересованных',
            gatherTribe: 'Собрать всё племя',
            reQuest: 'Встретиться ещё раз',
        },
        spawnDescribe: 'Какое задание нужно выполнить?',
        questAssigned: '👌 Задание назачено!',
        gatheringDescribe: 'Для чего созываем собрание?',
        gatheringWhen: 'Когда собираемся?',
        gatheringSetPlace: 'Где собираемся?',
        what: {
            all: 'племя',
            upvoters: 'всех интересующихся',
        },
        confirmPrompt: 'Собрать {what} для "{description}" в: \n {proposal}',
        proposal: ' • Время: {date|date}\n • Место: {place}',
        confirm: '✅ Да',
        edit: '🤔 Изменить',
        gatheringDone: 'Ok, я созываю народ!',
    },
    gathering: {
        declared: `Общее собрание по поводу "{reason}": \n {proposal}`,
        proposal: ' • Время: {date|date}\n • Место: {place}',
        accept: 'Хоршо, буду!',
        decline: 'Нет, не смогу участвовать',
        accepted: '☺️ Отлично! До встречи!',
        declined: '🥺 Блин, печаль...',
        ratePrompt: 'Как прошло собрание?',
        rates: { '0': '😩', '1': '😒', '2': '😐', '3': '😌', '4': '🥰' },
        rateDone: 'Ок. Ваша оценка учтена.',
    },
    calendar: {
        weekdays: 'Пн,Вт,Ср,Чт,Пт,Сб,Вс',
        months: 'Январь,Февраль,Март,Апрель,Май,Июнь,Июль,Август,Сентябрь,Октябрь,Ноябрь,Декабрь',
        startWeekDay: '1',
        proposeTimeHours: '🕘 В котором часу?',
        proposeTimeMinutes: '🕤 Уточните минуты',
    },
    questNegotiation: {
        proposeDate: '📅 Выберите день, когда бы вы хотели встретиться c {who}',
        proposeTimeHours: '🕘 В котором часу?',
        proposeTimeMinutes: '🕤 Уточните минуты',
        proposePlace: '🌍 Место встречи?',
        proposal: '• Время: {date|date}\n • Место: {place}',
        proposalConfirmPrompt: 'Вы предлагаете встретиться: \n {proposal}',
        confirm: '✅ Ок!',
        edit: '🤔 Изменить',
        proposeOther: '🤔 Предложить иначе',
        proposalDone: '📨 Ок, предложение отрправлено!',
        proposalAgreed: '📨 Ок, я сообщу остальным',
        proposalAgreedPersonal: '📨 Ок, я извещу {who}',
        questAccepted:
            'Все согласны встртиться для "{description}" в: \n {proposal}',
        questAcceptedPersonal: '{who} agreed to meet at: \n {proposal}',
    },
    tribeApplication: {
        title: 'Новая заявка на вступление в плем {tribe}!',
        applicant: 'От пользователя {username}.',
        coverLetter: 'Он сообщает, что:',
        assignInitiation: 'Предложить встретиться',
        decline: 'Отклонить',
        applicationDeclined: 'Ваша заявка в племя {tribe} отклонена.',
    },
    rateMember: {
        elderCharismaPrompt:
            'Вы только что встретились с {elder}ом племени {tribe}. Насколько харизматичным он[а] вам показался?',
        charismaPrompt:
            'Вы только что встретились с {name}. Насколько харизматичным он[а] вам показался?',
        wisdomPrompt: 'А насколько мудр?',
        help: 'ℹ️',
        charisma: { '0': '😩', '1': '😕', '2': '🤔', '3': '🤩', '4': '🔥' },
        wisdom: { '0': '🤪', '1': '🤥', '2': '🤔', '3': '🥸', '4': '🦉' },
        done: 'Хорошо! Ваша оценка скоро вступит в силу',
    },
    brainstorm: {
        timeToStorm: '⛈ Время устроить мозговой штурм!!!',
        toStormButton: '⚡️⚡️ Давайте же устроим! ⚡️⚡️',
        proposeDate: '📅 Выберите день, когда бы вы хотели встретиться c {who}',
        proposeTimeHours: '🕘 В котором часу?',
        proposeTimeMinutes: '🕤 Уточните минуты',
        confirmPrompt: 'Штурмуем в {date|date}?',
        confirm: '✅ Да',
        edit: '🤔 Изменить',
        done: '⛈ Ok. Созываю штурм! ⛈',
        brainstormDeclared:
            '⛈ Пора устроить мозгоштурм! Штурмуем в {date|date} ⛈',
        brainstormNotice:
            '⛈ There is a brainstorm on the horizon: {date|date}! ⛈',
        started: 'Мозговой штурм началася! Предлагайте своии идеи! 💥',
        toVote: 'Штурм окончен, пора оценить идеи!',
        end: 'Голосование закончено! Самые популярные идеи взяты в рабоу.',
    },

    errors: {
        // TODO fill other errors texts!!
        UpdateFinishedBrainstormError: '🚫 Мозгоштурм уже окончен.',
        SelfVotingIdeaError: '🚫 Вы не можете голосовать за свою идею.',
        DoubleVotingError: 'Нельзя оценивать что-то дважды.',
        UpdateFinishedIdeaError: 'Эта идея уже взята в работу (или отклонена).',
        InvalidTimeProposal: 'Невозможно встретиться в это время!',
        InvalidAcceptanceTime: '🤬  InvalidAcceptanceTime? 🤨',
        NotYourQuest: '🚫 Не-а. Это не ваше задание.',
        IndeclinableError: 'Это задание нельзя пропустить.',
        QuestIncompleteError:
            'Нельзя согласиться с этим заданием, оно описано не полностью.',
        NotParticipated: '🚫 Не-а. Вы не участвовали в этом собрании',
        VoteRangeError: '🚫 Слишком круто! ',
        SelfVotingError: '🚫 Не-а. Нельзя оценить самого себя.',
        ApplicationTransitionError: '🤬  ApplicationTransitionError? 🤨',
        NoChiefTribeError: '🤨 Хм. У этого племени нет вождя.',
        EntityNotFound: '🤨 404. Не найдено. А что вы пытались найти?',
        NotYourTribe: '🚫 Не-а. Вы не из этого племени (уже?).',
        NoIdeaError: '🤬 NoIdeaError? 🤨',
        AlreadyHaveChief: '🤨 Хм. В этом племени уже есть вождь.',
        ElderMismatchError: '🤬 ElderMismatchError? 🤨',
        WrongQuestError: '🤬 WrongQuestError? 🤨',
        NoChiefSetError: '🤨 Хм. У этого племени нет вождя.',
        NoShamanSetError: '🤨 Хм. У этого племени нет шамана.',
        WrongPhaseError:
            '🚫 К сожалению, теперь эта заявка уже не в вашей власти.',
        VotingNotStartedError: '🚫 Голосование ещё не началось',
        ExternalMemberVoteError: '🚫 Не-а. Вы не из этого племени (уже?).',
        NotEnoughMembers: '🤬 NotEnoughMembers? 🤨',
        NotAChiefError: '🚫 Только вождь может начать мозгоштурм.',
        FinalizeBeforeVotingError:
            '🤬 System error! Невозможно завершить мозгоштурм до конца голосования',
        StormNotStarted:
            '🤬 System error! Нельяз добавить идею, мозгоштурм ещё не начался',
        QuestFinishedError: '🚫 Это задание уже завершено.',
        common: '☠️ Упс! Что-то пошло не так.',
        commonWithText: '☠️ Oops! {message}',
    },
}

export default ru
