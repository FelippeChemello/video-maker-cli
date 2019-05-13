const googleTTS = require('google-tts-api');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const download = require('download-file')
const audioconcat = require('audioconcat')

const state = require('./state.js');

async function robot() {
    //Authenticates GoogleTTS
    process.env.GOOGLE_APPLICATION_CREDENTIALS = "credentials/google-tts.json";

    console.log('> [voice-robot] Starting...');
    const content = state.load();

    let voices = [];
    let sentenceLenght;
    let languageFree;
    let languagePaid;
    let prefixLanguagePaid;

    if(content.voice === "Paga" || content.voice === "Paid"){
        sentenceLenght = 0;
    }else{
        sentenceLenght = 200;
    }

    if(content.language === "PT"){
        languageFree = "pt";
        prefixLanguagePaid = "pt-BR";
        prefixLanguagePaid = "pt-BR";
        languagePaid = "pt-BR-Wavenet-A";
    } else if (content.language === "EN"){
        languageFree = "en";
        prefixLanguagePaid = "en-US";
        languagePaid = "en-US-Wavenet-C";
    }

    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {

        console.log(`> [voice-robot] Sentence ${sentenceIndex}`);
        let text = content.sentences[sentenceIndex].text;

        if (text.length < sentenceLenght) {
            await freeGoogleTTS(text, sentenceIndex);
        } else {
            await paidGoogleTTS(text, sentenceIndex);
        }

    }

    let i = 0;
    voices.push("./IntroAudioMute.mp3");
    do{
        if(fs.existsSync(`./content/output[${i}].mp3`)){
            voices.push(`./content/output[${i}].mp3`);
            console.log(`> [voice-robot] output[${i}].mp3 confirmed`);
            i++;
        }else{
            console.error(`> [voice-robot] output[${i}].mp3 doesn't exist`);
            await sleep(1000);
        }
    }while (i < content.sentences.length);

    await voicesConcat();

    async function voicesConcat() {
        return new Promise((resolve, reject) => {
            audioconcat(voices)
                .concat('./content/output[final].mp3')
                .on('start', function (command) {
                    console.log('> [voice-robot] Voices concat started, command: ', command)
                })
                .on('error', function (err, stdout, stderr) {
                    console.error('Error:', err)
                    console.error('ffmpeg stderr:', stderr)
                })
                .on('end', function (output) {
                    console.error('> [voice-robot] Audio created in: /content/output[final].mp3', output)
                    resolve();
                })
        });
    }


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function freeGoogleTTS(text, sentenceIndex) {
        console.log('> [voice-robot] Free request');

        let options = {
            directory: ".",
            filename: "./content/output[" + sentenceIndex + "].mp3"
        };

        await googleTTS(text, languageFree, 1).then(async function (url) {
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
                languageCode: prefixLanguagePaid,
                name: languagePaid
            },
            audioConfig: {audioEncoding: 'MP3'}
        };

        await client.synthesizeSpeech(request, async (err, response) => {
            if (err) {
                console.log(`> [voice-robot] Sentence ${sentenceIndex} synthesize error - ${err}`);
            }else{
                console.log(`> [voice-robot] Sentence ${sentenceIndex} synthesize complete`);
            }

            await fs.writeFile(`./content/output[${sentenceIndex}].mp3`, response.audioContent, 'binary', err => {
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

