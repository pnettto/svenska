const Datastore = require('nedb-promises');

const db = Datastore.create({
    filename: './words.db',
    autoload: true
});

const input = `
dags att gå vidare, time to move on, Det är nog dags att gå vidare., It’s probably time to move on.
hur känns det?, how does it feel?, Hur känns det idag?, How does it feel today?
det blir bra, it'll be fine, Det blir bra till slut., It will be fine in the end.
god morgon, good morning, God morgon allihop., Good morning everyone.
hur ska du ta dig därifrån?, how will you get out of that?, Hur ska du ta dig ur situationen?, How will you get out of the situation?
vad saknar du mest?, what do you miss the most?, Vad saknar du mest hemifrån?, What do you miss most from home?
inte omöjligt, not impossible, Det är inte omöjligt att fixa., It’s not impossible to fix.
har du nån plan?, do you have a plan?, Har du nån plan för kvällen?, Do you have a plan for the evening?
vad tänkte du på?, what were you thinking?, Vad tänkte du på egentligen?, What were you thinking really?
ska vi boka en tid?, should we book a time?, Ska vi boka en tid imorgon?, Should we book a time tomorrow?
hur går det?, how’s it going?, Hur går det med projektet?, How’s the project going?
bra tajming, good timing, Det var bra tajming av dig., That was good timing from you.
du följde ditt hjärta, you followed your heart, Jag följde mitt hjärta., I followed my heart.
det händer hela tiden, happens all the time, Det där händer hela tiden., That happens all the time.
kör hårt!, go for it!, Kör hårt på provet!, Go for it on the test!
hur länge sen då?, how long ago?, Hur länge sen var det?, How long ago was it?
är du sugen på...?, are you up for...?, Är du sugen på fika?, Are you up for a coffee?
jag fattar ingenting, I don’t understand anything, Jag fattar ingenting just nu., I don’t understand anything right now.
fråga honom, ask him, Fråga honom själv!, Ask him yourself!
ska vi gå vidare?, shall we move on?, Ska vi gå vidare nu?, Shall we move on now?
det låter vilsamt, that sounds restful, Det låter väldigt vilsamt., That sounds very restful.
jag beklagar, my condolences, Jag beklagar verkligen., My deepest condolences.
det är ingen fara, it’s no problem, Det är ingen fara alls., It’s no problem at all.
vad har hänt?, what happened?, Vad har hänt här?, What happened here?
behöver du hjälp?, do you need help?, Behöver du hjälp med något?, Do you need help with anything?
hoppa in, hop in, Hoppa in i bilen!, Hop in the car!
jaha?, oh really?, Jaha? Det visste jag inte., Oh really? I didn’t know that.
det går över, it passes, Det går över snart., It’ll pass soon.
det var bättre, that was better, Nu var det bättre., That was better now.
packa en väska, pack a bag, Packa en väska så åker vi., Pack a bag and we’ll go.
god natt, good night, God natt och sov gott., Good night and sleep well.
kan jag hjälpa dig med nåt?, can I help you with something?, Kan jag hjälpa dig med nåt idag?, Can I help you with something today?
jaha okej, okay then, Jaha okej det funkar., Okay then that works.
det var allt, that was all, Det var allt för nu., That’s all for now.
hur ofta då?, how often?, Hur ofta tränar du?, How often do you train?
det går toppen, it's going great, Det går toppen på jobbet., It’s going great at work.
vill du ha popcorn?, do you want popcorn?, Vill du ha popcorn till filmen?, Do you want popcorn for the movie?
du ser utsövd ut, you look well rested, Du ser utsövd ut i dag., You look well rested today.
`;

async function importFromString(str) {
    const lines = str
        .trim()
        .split('\n')
        .filter(line => line.trim().length > 0);

    const docs = lines.map(line => {
        const parts = line.split(/,\s+/); // split on ", "

        if (parts.length !== 4) {
            throw new Error(`Invalid line (expected 4 fields): ${line}`);
        }

        const [phrase_sv, phrase_en, example_sv, example_en] = parts;

        return {
            phrase_sv,
            phrase_en,
            example_sv,
            example_en
        };
    });

    const result = await db.insert(docs);
    console.log(`Inserted ${result.length} documents.`);
}

importFromString(input)
    .catch(err => console.error('Import error:', err));
