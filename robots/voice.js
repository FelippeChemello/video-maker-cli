const googleTTS = require('google-tts-api');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const download = require('download-file')

const state = require('./state.js');


async function robot() {

    console.log('> [voice-robot] Starting...');
    const content = state.load();

    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {

        console.log(`> [voice-robot] Sentence ${sentenceIndex}`);
        let text = content.sentences[sentenceIndex].text;

        console.log(text);

        if (text.length < 200) {
            await freeGoogleTTS(text, sentenceIndex);
        } else {
            await paidGoogleTTS(text, sentenceIndex);
        }
    }

    async function freeGoogleTTS(text, sentenceIndex) {
        console.log('> [voice-robot] Free request');

        let options = {
            directory: ".",
            filename: "output[" + sentenceIndex + "].mp3"
        };

        await googleTTS(text, 'pt', 1).then(async function (url) {
            await download(url, options, function(err){
                if (err) {
                    console.log(`> [voice-robot] Sentence ${sentenceIndex} download error `);
                }else{
                    console.log(`> [voice-robot] output[${sentenceIndex}].mp3 successful download `);
                }
            });
        });
    }

    async function paidGoogleTTS(text, sentenceIndex) {

        console.log('> [voice-robot] Paid request');

        const client = new textToSpeech.TextToSpeechClient();

        const request = {
            input: {text: text},
            voice: {
                languageCode: 'pt-BR',
                name: "pt-BR-Wavenet-A"
            },
            audioConfig: {audioEncoding: 'MP3'}
        };

        await client.synthesizeSpeech(request, async (err, response) => {
            if (err) {
                console.log(`> [voice-robot] Sentence ${sentenceIndex} synthesize error - ${err}`);
            }else{
                console.log(`> [voice-robot] Sentence ${sentenceIndex} synthesize complete`);
            }

            await fs.writeFile(`output[${sentenceIndex}].mp3`, response.audioContent, 'binary', err => {
                if (err) {
                    console.log(`> [voice-robot] Sentence ${sentenceIndex} error - ${err}`)
                } else{
                    console.log(`> [voice-robot] output[${sentenceIndex}].mp3 successful download `);
                }
            });
        });
    }

}


module.exports = robot

