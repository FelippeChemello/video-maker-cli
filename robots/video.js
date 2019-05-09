const gm = require("gm").subClass({ imageMagick: true });
const state = require("./state.js");
const spawn = require("child_process").spawn;
const path = require("path");
const rootPath = path.resolve(__dirname, "..");
const videoshow = require("videoshow");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffprobePath = require("@ffprobe-installer/ffprobe").path;
const mp3Duration = require('mp3-duration');
let ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

async function robot() {
  const content = state.load();

  let images = [];
  var tempo;
  var qntImages = 0;


  await convertAllImages(content);
  //await createAllSentenceImages(content);
  await createYouTubeThumbnail();
  //await createAfterEffectsScript(content);
  await renderVideo("node", content);

  state.save(content);

  async function convertAllImages(content) {
    for (
      let sentenceIndex = 0;
      sentenceIndex < content.sentences.length;
      sentenceIndex++
    ) {
      await convertImage(sentenceIndex);
    }
  }

  async function convertImage(sentenceIndex) {
    return new Promise((resolve, reject) => {
      const inputFile = `./content/${sentenceIndex}-original.png[0]`;
      const outputFile = `./content/${sentenceIndex}-converted.png`;
      const width = 1280;
      const height = 720;

      gm()
        .in(inputFile)
        .out("(")
        .out("-clone")
        .out("0")
        .out("-background", "white")
        .out("-blur", "0x9")
        .out("-resize", `${width}x${height}^`)
        .out(")")
        .out("(")
        .out("-clone")
        .out("0")
        .out("-background", "white")
        .out("-resize", `${width}x${height}`)
        .out(")")
        .out("-delete", "0")
        .out("-gravity", "center")
        .out("-compose", "over")
        .out("-composite")
        .out("-extent", `${width}x${height}`)
        .write(outputFile, error => {
          if (error) {
            return reject(error);
          }

          console.log(`> [video-robot] Image converted: ${inputFile}`);
          resolve();
        });
    });
  }

  async function createAllSentenceImages(content) {
    for (
      let sentenceIndex = 0;
      sentenceIndex < content.sentences.length;
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

      const templateSettings = {
        0: {
          size: "1920x400",
          gravity: "center"
        },
        1: {
          size: "1920x1080",
          gravity: "center"
        },
        2: {
          size: "800x1080",
          gravity: "west"
        },
        3: {
          size: "1920x400",
          gravity: "center"
        },
        4: {
          size: "1920x1080",
          gravity: "center"
        },
        5: {
          size: "800x1080",
          gravity: "west"
        },
        6: {
          size: "1920x400",
          gravity: "center"
        }
      };

      gm()
        .out("-size", templateSettings[sentenceIndex].size)
        .out("-gravity", templateSettings[sentenceIndex].gravity)
        .out("-background", "transparent")
        .out("-fill", "white")
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

  // async function createAfterEffectsScript(content) {
  //   await state.saveScript(content);
  // }
  //
  // async function renderVideoWithAfterEffects() {
  //   return new Promise((resolve, reject) => {
  //     const aerenderFilePath =
  //       "/Applications/Adobe After Effects CC 2019/aerender";
  //     const templateFilePath = `${rootPath}/templates/1/template.aep`;
  //     const destinationFilePath = `${rootPath}/content/output.mov`;
  //
  //     console.log("> [video-robot] Starting After Effects");
  //
  //     const aerender = spawn(aerenderFilePath, [
  //       "-comp",
  //       "main",
  //       "-project",
  //       templateFilePath,
  //       "-output",
  //       destinationFilePath
  //     ]);
  //
  //     aerender.stdout.on("data", data => {
  //       process.stdout.write(data);
  //     });
  //
  //     aerender.on("close", () => {
  //       console.log("> [video-robot] After Effects closed");
  //       resolve();
  //     });
  //   });
  // }

  async function defineTimeOfEachSlide(){
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++) {
      await mp3Duration(`output[${sentenceIndex}].mp3`, function (err, duration) {
        if (err) return console.log(err.message);
        tempo = duration;
        console.log(`File output[${sentenceIndex}] - ${duration} secounds`);
      });
      await images.push({
        path: `./content/${sentenceIndex}-converted.png`,
        caption: content.sentences[sentenceIndex].text,
        loop: tempo/5
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

      var i = 0;

      console.log("> [video-robot] Starting render")

      videoshow(images, videoOptions)
         .audio("song.mp3")
         .save("video.mp4")
         .on("start", function(command) {
             console.log("> [video-robot] ffmpeg process started:", command);
             i++;
         })
         .on('progress', function(progress) {
           var process = 0;
           if(i <= 1) {
             process = progress.percent;
             process = process/qntImages;
           }else{
             process = progress.percent;
           }
           if (typeof process === 'undefined') {
             process = 0;
           }
             console.log("> [video-robot] Processing: " + process.toFixed(2) + "%");

         })
        .on("error", function(err, stdout, stderr) {
            console.error("> [video-robot] Error:", err);
            console.error("> [video-robot] ffmpeg stderr:", stderr);
        })
        .on("end", function(output) {
            console.log("> [video-robot] Video created in:", output);
            resolve();
        });
    });

    
  }

  async function renderVideo(type, content) {
    if (type == "after") {
    //   await renderVideoWithAfterEffects();
    //   console.log("> [video-robot] Renderização finalizada");
        console.log("Renderização por AfterEffects desabilitada!");
     } else {
      await renderVideoWithNode(content);
      console.log("> [video-robot] Renderização finalizada");
     }
  }
}

module.exports = robot;
