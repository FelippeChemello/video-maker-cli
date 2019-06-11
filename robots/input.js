const readline = require('readline-sync');
const parser = require('rss-parser');
const state = require('./state.js');
const database = require('./database.js');

async function robot() {

    let content = {};

    const pattern = askAndReturnPattern();

    if (pattern === "Custom") {

        content.language = await askVideoLanguage();
        content.voice = await askVoice();
        const searchPlace = await askWikipediaOrGoogle();
        if(searchPlace === 'Google'){
            content.searchTerm = await askAndReturnGoogleTrend()
        }else {
            content.searchTerm = await askAndReturnSearchTerm();
        }
        content.prefix = await askAndReturnPrefix();
        content.maximumSentences = await askQuantityofSentences();
        content.videoDestination = await askVideoDestination();
        state.save(content);
        database.saveBaseData(content);

    }else if (pattern === "LoadId"){

        const id = askIdDatabase();
        content = await database.loadById(id);
        state.save(content);
        console.log(content)

    }else if (pattern === "Default"){

        content = await database.loadById(1);
        content.searchTerm = askAndReturnSearchTerm();
        state.save(content);
        database.saveBaseData();

    }else{

        console.log("Exiting...");
        process.exit();

    }

    function askVideoLanguage() {
        const language = ['PT', 'EN'];
        const selectedLanguageIndex = readline.keyInSelect(language, 'Choose your language: ');

        return language[selectedLanguageIndex];
    }

    function askAndReturnPattern(){
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

    function askWikipediaOrGoogle(){
        let query;
        if (content.language === "PT") {
            query = 'Deseja pesquisar um termo personalizado ou exibir sugestões do Google Trends?'
        } else {
            query = 'Do you want to insert a custom search term or show Google Trends Suggestions? '
        }

        const searchPlace = ['Custom', 'Google'];
        const selectedSearchPlaceIndex = readline.keyInSelect(searchPlace, query);

        return searchPlace[selectedSearchPlaceIndex];
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
    
    async function askAndReturnGoogleTrend() {
        let query;
        if (content.language === "PT") {
            console.log('[Input] Por favor aguarde...');
            query = "Selecione o Trend para pesquisa na Wikipedia";
        }else{
            console.log('[Input] Please wait...')
            query = "Choose your trend to search in Wikipedia";
        }

        const trends = await getGoogleTrends();
        const choice = readline.keyInSelect(trends, query);

        return trends[choice];
    }

    async function getGoogleTrends () {
        let trend_url;
        if (content.language === "PT") {
            trend_url = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=BR";
        }else{
            trend_url = "https://trends.google.com/trends/trendingsearches/daily/rss?geo=US";
        }
        const parsing = new parser();
        const trends = await parsing.parseURL(trend_url);
        return trends.items.map(({title}) => title)
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

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

}

module.exports = robot;