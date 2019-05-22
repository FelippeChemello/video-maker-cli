const robots = {
    start: require('./robots/start.js'),
    input: require('./robots/input.js'),
    trends: require('./robots/trends'),
    text: require('./robots/text.js'),
    state: require('./robots/state.js'),
    image: require('./robots/image.js'),
    voice: require('./robots/voice'),
    video: require('./robots/video.js'),
    youtube: require('./robots/youtube.js')
};


async function start() {

    await robots.start();
    robots.input();
    await robots.trends();
    await robots.text();
    await robots.image();
    await robots.voice();
    await robots.video();
    await robots.youtube()
}

start();
