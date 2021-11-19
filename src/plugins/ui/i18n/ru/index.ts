import type { Translation } from '../i18n-types'

// TODO don't forget to enable this:
// const ru: Translation = {
const ru = {
    start: {
        text: 'Присоединись к племени или гильдии единомышленников в твоём городе',
        buttons: {
            list: 'ℹ️ Список племён',
            rules: '📜 Правила игры',
        },
    },
    rules: {
        buttons: {
            back: '← Назад',
            start: '🚀 Поехали!',
            onShaman: 'Кто такой шаман?',
            onChief: 'Кто такой вождь?',
            next: 'И что дальше?',
            onBrainsotrm: 'Что ещё за мозговой штурм?',
            onQuests: 'Что за квесты?',
        },
        apply:
            'Чтобы присоединиться к племени, нужно подать заявку. ' +
            'Вождь и шаман рассмотрят её, и пригласят вас на встречу. ' +
            'Если по итогам этих встреч они решат, что вы хорошо впишетесь в племя, вы к нему присоединитесь',
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
    calendar: {
        weekdays: 'Пн,Вт,Ср,Чт,Пт,Сб,Вс',
        months: 'Январь,Февраль,Март,Апрель,Май,Июнь,Июль,Август,Сентябрь,Октябрь,Ноябрь,Декабрь',
        startWeekDay: '1',
    },
    questNegotiation: {
        proposeDate: '📅 Выберите день, когда бы вы хотели встретиться c {who}',
        proposeTimeHours: '🕘 В котором часу?',
        proposeTimeMinutes: '🕤 Уточните минуты',
        proposePlace: '🗿 Место встречи?',
        proposal:
            'Вы предлагаете встретиться: \n • Время: {date|date}\n • Место: {place}',
        proposalRecieved:
            '{who} предлагает встретиться: \n • Время: {date|date}\n • Место: {place}',
        confirm: '✅ Предложить',
        proposeOther: '🤔 Propose other date/time',
        edit: '🤔 Изменить',
        proposalDone: 'Ок, предложение отрправлено!',
    },
    tribesList: {
        requestLocationText: 'В каком городе вы находитесь?',
        requestLocation: '🌍 Ок, я тут',
        apply: '🚀 Подать заявку',
        count: 'Численность:',
        searchIn: 'Племена в городе {city}:',
        applyText:
            'Расскажите вождю и шаману племени о себе и о том, почему вы хотите присоединиться к "{tribe}"',
        applicationSent:
            'Заявка отправлена. Вождь племени скоро предложит встретиться.',
        applicationSentShort: 'Заявка отправлена',
    },
    initiation: {
        declineText: 'Пожалуйста, опишите, почему вы решили отказать?',
        declinedForElder: 'Ок. Заявка отклонена',
    },
    notifications: {
        tribeAppliaction: {
            title: 'Новая заявка на вступление в плем {tribe}!',
            applicant: 'От пользователя {username}.',
            coverLetter: 'Он сообщает, что:',
            assignInitiation: 'Предложить встретиться',
            decline: 'Отклонить',
            declinedForApplicant: 'Ваша заявка в племя {tribe} отклонена.',
        },
    },
}

// TODO and remove this
export default ru as any as Translation
