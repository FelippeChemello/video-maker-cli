const algorithmia = require('algorithmia');
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey;
const sentenceBoundaryDetection = require('sbd');
const readline = require('readline-sync');

const watsonApiKey = require('../credentials/watson-nlu.json').apikey;
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    version: '2018-04-05',
    url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});

const state = require('./state.js');

async function robot() {
    console.log('> [text-robot] Starting...');
    const content = state.load();

    let languageOfSearch = await verifyLanguage(content);
    await fetchContentFromWikipedia(content);
    sanitizeContent(content);
    breakContentIntoSentences(content);
    limitMaximumSentences(content);
    await fetchKeywordsOfAllSentences(content);
    await checkNumberOfSentences(content);
    await createFullText(content);
    await askRemoveSentence(content);

    state.save(content);

    async function verifyLanguage(content) {
        if (content.language === "PT") {
            return "pt";
        } else if (content.language === "EN") {
            return "en";
        }
    }

    async function fetchContentFromWikipedia(content) {
        console.log('> [text-robot] Fetching content from Wikipedia');
        var input = {
            "articleName": content.searchTerm,
            "lang": languageOfSearch
        };
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey);
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2');
        const wikipediaResponse = await wikipediaAlgorithm.pipe(input);
        const wikipediaContent = wikipediaResponse.get();

        content.sourceContentOriginal = wikipediaContent.content;
        console.log('> [text-robot] Fetching done!')
    }

    function sanitizeContent(content) {
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal);
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown);

        content.sourceContentSanitized = withoutDatesInParentheses;

        function removeBlankLinesAndMarkdown(text) {
            const allLines = text.split('\n');

            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                return true
            });

            return withoutBlankLinesAndMarkdown.join(' ')
        }
    }

    function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g, ' ')
    }

    function breakContentIntoSentences(content) {
        content.sentences = [];

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized);
        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }

    function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences)
    }

    async function fetchKeywordsOfAllSentences(content) {
        console.log('> [text-robot] Starting to fetch keywords from Watson');

        for (const sentence of content.sentences) {
            console.log(`> [text-robot] Sentence: "${sentence.text}"`);

            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text);

            console.log(`> [text-robot] Keywords: ${sentence.keywords.join(', ')}\n`)
        }
    }

    async function fetchWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, (error, response) => {
                if (error) {
                    reject(error);
                    return
                }

                const keywords = response.keywords.map((keyword) => {
                    return keyword.text
                });

                resolve(keywords)
            })
        })
    }

    function checkNumberOfSentences(content){
        if(content.sentences.length < content.maximumSentences){
            console.error("> [text-robot] Wikipedia article doesn't fetch to number of senteces asked");
            console.error("> [text-robot] Please ask only " + content.sentences.length + " sentences or choose another SearchTerm");
            console.error("> [text-robot] Exiting... ");
            process.exit(1);
        }
    }

    async function createFullText(content) {
        console.log('> [text-robot] Creating fulltext');
        content.fullText = "";
        return new Promise((resolve, reject) => {
            for (
                let sentenceIndex = 0;
                sentenceIndex < content.maximumSentences;
                sentenceIndex++
            ) {
                content.fullText += " \n\n\n ";
                content.fullText += content.sentences[sentenceIndex].text;
            }
            console.log('> [text-robot] Fulltext created');
            resolve();
        })
    }

    async function askRemoveSentence(content) {
        return new Promise((resolve, reject) => {
            let query;
            let query2;
            let awnser;
            let awnser2 = [];
            let selectedSentenceIndex = [];

            for (let index = 0; index < content.maximumSentences; index++) {
                awnser2.push(index + 1);
            }

            showSentencesWithIndex(content);

            if (content.language === "PT") {
                query = "\n\n> [text-robot] Deseja excluir alguma frase? ";
                awnser = ["Sim", "Não"];
                query2 = "> [text-robot] Qual frase você deseja remover? ";
            } else {
                query = "\n\n> [text-robot] Do you want to remove any sentence? ";
                awnser = ["Yes", "No"];
                query2 = "> [text-robot] Which sentence do you want to remove?";
            }
            let selectedAwnserIndex = readline.keyInSelect(awnser, query);
            while (selectedAwnserIndex === 0) {
                selectedSentenceIndex.push(readline.keyInSelect(awnser2, query2));

                let index = selectedSentenceIndex[0];
                //console.log(`Removendo sentença ${index}`);
                for (let i = index; i < (content.maximumSentences); i++) {
                    content.sentences[i] = content.sentences[i + 1];
                    //console.log(`Sentença ${i + 1} virou ${i}`);
                }
                content.maximumSentences = (content.maximumSentences - 1);
                selectedSentenceIndex.shift();

                awnser2 = [];
                for (let index = 0; index < content.maximumSentences; index++) {
                    awnser2.push(index + 1);
                }

                showSentencesWithIndex(content);
                selectedAwnserIndex = readline.keyInSelect(awnser, query);
            }
            resolve();
        });
    }

    function showSentencesWithIndex(content) {
        for (let index = 0; index < content.maximumSentences; index++) {
            console.log(`> [text-robot] Sentence ${index + 1} \n${content.sentences[index].text} \n`)
        }
    }

}

module.exports = robot;
