const robots = {
  input: require('./robots/input.js'),
  text: require('./robots/text.js'),
  state: require('./robots/state.js'),
  image: require('./robots/image.js'),
  voice: require('./robots/voice'),
  video: require('./robots/video.js'),
  youtube: require('./robots/youtube.js')
}

async function start() {
  //robots.input()
  //await robots.text()
  //await robots.image()
  //await robots.voice()
  await robots.video()
  //await robots.youtube()
}

start()
