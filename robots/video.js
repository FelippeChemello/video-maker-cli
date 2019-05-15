const gm = require("gm").subClass({imageMagick: true});
const state = require("./state.js");
const spawn = require("child_process").spawn;
const path = require("path");
const rootPath = path.resolve(__dirname, "..");
const videoshow = require("videoshow");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const mp3Duration = require('mp3-duration');
const fs = require('fs');
let ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

async function robot() {

    console.log("> [video-robot] Starting...");

    const content = state.load();

    let images = [];
    var tempo;
    var qntImages = 0;

    await createAllSentenceImages(content);
    await convertAllImages(content);
    await insertAllSentencesInImages(content);
    await createYouTubeThumbnail();
    await createImageIntro(content);
    await renderVideo("node", content);

    state.save(content);

    async function convertAllImages(content) {
        for (
            let sentenceIndex = 0;
            sentenceIndex < content.maximumSentences;
            sentenceIndex++
        ) {
            await convertImage(sentenceIndex, content.sentences[sentenceIndex].text);
        }
    }

    async function convertImage(sentenceIndex) {
        return new Promise((resolve, reject) => {
            const inputFile = `./content/${sentenceIndex}-original.png[0]`;
            const outputFile = `./content/${sentenceIndex}-converted.png`;
            const width = 1920;
            const height = 1080;

            gm()
                .in(inputFile)
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-blur', '0x9')
                .out('-resize', `${width}x${height}^`)
                .out(')')
                .out('(')
                .out('-clone')
                .out('0')
                .out('-background', 'white')
                .out('-resize', `${width}x${height}`)
                .out(')')
                .out('-delete', '0')
                .out('-gravity', 'center')
                .out('-compose', 'over')
                .out('-composite')
                .out('-extent', `${width}x${height}`)
                .write(outputFile, (error) => {
                    if (error) {
                        return reject(error)
                    }

                    console.log(`> [video-robot] Image converted: ${outputFile}`);
                    resolve()
                })

        })
    }


    async function insertAllSentencesInImages(content) {
        for (
            let sentenceIndex = 0;
            sentenceIndex < (content.maximumSentences);
            sentenceIndex++
        ) {
            await insertSentenceInImage(sentenceIndex);
        }
    }

    async function insertSentenceInImage(sentenceIndex) {
        return new Promise((resolve, reject) => {
            const inputFile = `./content/${sentenceIndex}-converted.png`;
            const inputTextFile = `./content/${sentenceIndex}-sentence.png`;
            const outputFile = `./content/${sentenceIndex}-finished.png`;
            const width = 1280;
            const height = 720;

            gm(inputFile)
                .resize(width, height)
                .composite(inputTextFile)
                .gravity('South')
                .write(outputFile, function (err) {
                    if (err) {
                        console.error(`> [video-robot] Image compose ERROR: ${inputFile} & ${inputTextFile}`);
                    } else {
                        console.log(`> [video-robot] Image compose complete: ${outputFile}`);
                        resolve();
                    }
                });
        });
    }

    async function createAllSentenceImages(content) {
        for (
            let sentenceIndex = 0;
            sentenceIndex < content.maximumSentences;
            sentenceIndex++
        ) {
            await createSentenceImage(
                sentenceIndex,
                content.sentences[sentenceIndex].text
            );
        }
    }

    async function createSentenceImage(sentenceIndex, sentenceText) {
        return new Promise((resolve, reject) => {
            const outputFile = `./content/${sentenceIndex}-sentence.png`;
            const size = "5120x720";
            const gravity = "west";

            gm()
                .out("-size", size)
                .out("-gravity", gravity)
                .out("-background", "transparent")
                .out("-fill", "yellow")
                .out("-stroke", "gray")
                .out("-strokewidth", "5")
                .out("-kerning", "-1")
                .out(`caption:${sentenceText}`)
                .write(outputFile, error => {
                    if (error) {
                        return reject(error);
                    }

                    console.log(`> [video-robot] Sentence created: ${outputFile}`);
                    resolve();
                });
        });
    }

    async function createImageIntro(content) {
        console.log("> [video-robot] Creating video intro");

        let outputFileSentence = "./content/introSentence.png";
        let outputFileImage = "./content/introImage.png";
        let outputImageIntro = "./content/video-intro.png";

        await createSentenceIntro(content, outputFileSentence, outputFileImage);
        await convertImageIntro(outputFileImage);
        await composeIntroImage(outputFileSentence, outputFileImage, outputImageIntro);
    }

    async function createSentenceIntro(content, outputFileSentence) {
        return new Promise((resolve, reject) => {
            let sentenceText;
            if(content.prefix === ':ABOUT:'){
                sentenceText = content.searchTerm;
            }else{
                sentenceText = content.prefix + "\n" +  content.searchTerm;
            }

            gm()
                .out("-size", "2560x720")
                .out("-gravity", "Center")
                .out("-background", "transparent")
                .out("-fill", "Red")
                .out("-stroke", "gray")
                .out("-strokewidth", "5")
                .out("-kerning", "-1")
                .out(`caption:${sentenceText}`)
                .write(outputFileSentence, error => {
                    if (error) {
                        return reject(error);
                    }
                    console.log(`> [video-robot] Intro sentence created: ${outputFileSentence}`);
                    resolve();
                });
        });
    }

    async function convertImageIntro(outputFileImage) {
        return new Promise((resolve, reject) => {
            gm("./content/0-converted.png")
                .blur(7, 5)
                .write(outputFileImage, error => {
                    if (error) {
                        return reject(error);
                    }
                    console.log(`> [video-robot] Intro Image Converted: ${outputFileImage}`);
                    resolve();
                });
        });
    }

    async function composeIntroImage(outputFileSentence, outputFileImage, outputImageIntro) {
        return new Promise((resolve, reject) => {

            //console.log("> [video-robot] compondo imagem");
            gm(outputFileImage)
                .resize(1280, 720)
                .composite(outputFileSentence)
                .gravity("Center")
                .write(outputImageIntro, error => {
                    if (error) {
                        reject();
                    }
                    images.push({
                        path: outputImageIntro,
                        loop: 5
                    });
                    console.log("> [video-robot] Image intro created ");
                    resolve();
                });
        });


    }

    async function createYouTubeThumbnail() {
        return new Promise((resolve, reject) => {
            gm()
                .in("./content/0-converted.png")
                .write("./content/youtube-thumbnail.jpg", error => {
                    if (error) {
                        return reject(error);
                    }

                    console.log("> [video-robot] Creating YouTube thumbnail");
                    resolve();
                });
        });
    }

    async function defineTimeOfEachSlide() {
        for (let sentenceIndex = 0; sentenceIndex < content.maximumSentences; sentenceIndex++) {
            await mp3Duration(`./content/output[${sentenceIndex}].mp3`, function (err, duration) {
                if (err) return console.log(err.message);
                tempo = duration;
                //console.log(`File output[${sentenceIndex}] - ${duration} secounds`);
            });
            await images.push({
                path: `./content/${sentenceIndex}-finished.png`,
                //caption: content.sentences[sentenceIndex].text,
                loop: tempo
            });
            qntImages++;
        }
    }

    async function renderVideoWithNode(content) {
        await defineTimeOfEachSlide();

        return new Promise((resolve, reject) => {

            const videoOptions = {
                fps: 25,
                transition: true,
                transitionDuration: 1, // seconds
                videoBitrate: 1024,
                videoCodec: "libx264",
                size: "1280x720",
                audioBitrate: "128k",
                audioChannels: 2,
                format: "mp4",
                pixelFormat: "yuv420p",
                useSubRipSubtitles: false, // Use ASS/SSA subtitles instead
                subtitleStyle: {
                    Fontname: "Courier New",
                    Fontsize: "37",
                    PrimaryColour: "11861244",
                    SecondaryColour: "11861244",
                    TertiaryColour: "11861244",
                    BackColour: "-2147483640",
                    Bold: "2",
                    Italic: "0",
                    BorderStyle: "2",
                    Outline: "2",
                    Shadow: "3",
                    Alignment: "1", // left, middle, right
                    MarginL: "40",
                    MarginR: "60",
                    MarginV: "40"
                }
            };

            let i = 0;

            console.log("> [video-robot] Starting render");

            videoshow(images, videoOptions)
                .audio("./content/output[final].mp3")
                .save("video.mp4")
                .on("start", function (command) {
                    console.log("> [video-robot] ffmpeg process started:", command);
                    i++;
                })
                .on('progress', function (progress) {
                    if (typeof progress.targetSize !== 'undefined' && typeof progress.percent !== 'undefined') {
                        if (i <= 1) {
                            console.log("> [video-robot] Processing: " + progress.targetSize/1000 + "MB");
                        } else {
                            console.log("> [video-robot] Processing: " + (progress.percent).toFixed(2) + "%");
                        }
                    }
                })
                .on("error", function (err, stdout, stderr) {
                    console.error("> [video-robot] Error:", err);
                    console.error("> [video-robot] ffmpeg stderr:", stderr);
                })
                .on("end", function (output) {
                    console.log("> [video-robot] Video created in:", output);
                    resolve();
                });
        });
    }

    async function renderVideo(type, content) {
        if (type == "after") {
            console.log("Renderização por AfterEffects desabilitada!");
        } else {
            await renderVideoWithNode(content);
            console.log("> [video-robot] Renderização finalizada");
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = robot;
