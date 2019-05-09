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

            console.log('> [voice-robot] Free request');

            let options = {
                directory: ".",
                filename: "output[" + sentenceIndex + "].mp3"
            };

            googleTTS(text, 'pt', 1).then(function (url) {
                download(url, options, function(err){
                    if (err) {
                        console.log(`> [voice-robot] Sentence ${sentenceIndex} transcript error `);
                    }
                });
                console.log(`> [voice-robot] output[${sentenceIndex}].mp3 successful download `);
            });
        } else {

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

            client.synthesizeSpeech(request, (err, response) => {
                if (err) {
                    console.log(`> [voice-robot] Sentence ${sentenceIndex} transcript error `)
                }

                fs.writeFile(`output[${sentenceIndex}].mp3`, response.audioContent, 'binary', err => {
                    if (err) {
                        console.log(`> [voice-robot] Sentence ${sentenceIndex} transcript error `)
                    }
                    console.log(`> [voice-robot] output[${sentenceIndex}].mp3 successful download `);
                });
            });
        }
    }

}


module.exports = robot

