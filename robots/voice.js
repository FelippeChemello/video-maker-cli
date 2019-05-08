const watsonApiKey = require('../credentials/watson-tts.json').apikey;


const nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watsonApiKey,
    url: 'https://gateway-wdc.watsonplatform.net/text-to-speech/api'
})

const state = require('./state.js')

async function robot() {

}


module.exports = robot

HELP:https://stackoverflow.com/questions/39128703/how-to-use-watson-text-to-speech-api-in-node-js