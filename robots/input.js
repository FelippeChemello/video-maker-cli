const readline = require('readline-sync');
const state = require('./state.js');
const database = require('./database.js')

function robot() {

    const content = {};

    const saveOrLoad = askSaveOrLoad();

    if (saveOrLoad === "Custom") {

        content.language = askVideoLanguage();
        content.voice = askVoice();
        content.searchTerm = askAndReturnSearchTerm();
        content.prefix = askAndReturnPrefix();
        content.maximumSentences = askQuantityofSentences();
        content.videoDestination = askVideoDestination();
        state.save(content);
        database.saveBaseData(content);

    }else if (saveOrLoad === "LoadId"){

        content.id = askIdDatabase();
        state.save(content);
        robots.database("loadById");

    }else if (saveOrLoad === "Default"){

        content.id = 1;
        state.save(content);
        robots.database("loadById");
        console.log("input: " + content)
        content.searchTerm = askAndReturnSearchTerm();
        state.save(content);
        robots.database("saveBaseData");

    }else{

        console.log("Exiting...");
        process.exit();

    }

    function askVideoLanguage() {
        const language = ['PT', 'EN'];
        const selectedLanguageIndex = readline.keyInSelect(language, 'Choose your language: ');

        return language[selectedLanguageIndex];
    }

    function askSaveOrLoad(){
        let query = "Do you want to use a pattern or custom?";
        const options = ['Default', 'Custom', "LoadId"];
        const selectedOptionIndex = readline.keyInSelect(options, query);

        return options[selectedOptionIndex];
    }

    function askIdDatabase(){
        let query;
        if (content.language === "PT") {
            query = 'Qual Id você deseja utilizar? '
        } else {
            query = 'Insert an Id'
        }
        return readline.question(query);
    }

    function askVoice() {
        let voices;
        let query;
        if (content.language === "PT") {
            voices = ['Paga', 'Gratuita'];
            query = "Qual voz você deseja utilizar";
        } else {
            voices = ['Paid', 'Free'];
            query = "Choose your voice: ";
        }
        const selectedVoiceIndex = readline.keyInSelect(voices, query);

        return voices[selectedVoiceIndex];
    }

    function askQuantityofSentences() {
        let query;
        if (content.language === "PT") {
            query = 'Quantas sentenças você deseja no video? '
        } else {
            query = 'How much senteces do you want in your video? '
        }
        return readline.question(query);
    }

    function askAndReturnSearchTerm() {
        let query;
        if (content.language === "PT") {
            query = 'Insira um termo para pesquisa na Wikipedia: '
        } else {
            query = 'Insert a Wikipedia Search Term: '
        }
        return readline.question(query);
    }

    function askAndReturnPrefix() {
        let prefixes;
        let query;
        let query2;
        if (content.language === "PT") {
            prefixes = ['Quem é', 'O que é', 'A história de', ':ABOUT:', 'Personalizada'];
            query = "Escolha um prefixo:";
            query2 = "Insira o prefixo para pesquisa:";
        } else {
            prefixes = ['Who is', 'What is', 'The History of', ':ABOUT:', 'Custom'];
            query = "Escolha um prefixo:";
            query2 = "Insert a custom prefix: ";
        }
        const selectedPrefixIndex = readline.keyInSelect(prefixes, query);
        const selectedPrefixText = prefixes[selectedPrefixIndex];

        if (selectedPrefixText === "Personalizada" || selectedPrefixText === "Custom") {
            return readline.question(query2)
        }

        return selectedPrefixText
    }

    function askVideoDestination() {
        let query;
        if (content.language === "PT") {
            query = "Escolha o destino de seu video: ";
        } else {
            query = "Choose your video destination: ";
        }
        const destination = ['YouTube', 'Local'];
        const selectedDestinationIndex = readline.keyInSelect(destination, query);

        return destination[selectedDestinationIndex];
    }

}

module.exports = robot;