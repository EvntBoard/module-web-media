import { Howl } from 'howler';
import { EvntComWebSocket } from 'evntcom-js/dist/web';

const regexBase64 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

const NAME = 'media'

window.addEventListener('load', function () {
  let websocket
  if (import.meta.env.MODE === 'development') {
    websocket = new EvntComWebSocket({
      host: 'localhost',
      port: 5000,
      name: NAME,
    })
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('host') && urlParams.get('port')) {
      websocket = new EvntComWebSocket({
        host: urlParams.get('host'),
        port: parseInt(urlParams.get('port'), 10),
        name: NAME,
      });
    } else {
      websocket = new EvntComWebSocket({ name: NAME })
    }
  }

  websocket.expose('play', async (file, volume) => {
    if (typeof file === "object") {
      const playsFiles = file.map((i) => {
        if (regexBase64.test(i)) {
          return "data:audio/wav;base64," + i
        } else if (!i.startsWith('http')) {
          return `${window.location.origin}/media/${i}`
        }
        return i;
      })

      let pCount = 0;
      let howlerBank = [];

      // playing i+1 audio (= chaining audio files)
      const onend = () => {
        let newCount = pCount + 1
        if (newCount < howlerBank.length) {
          pCount = newCount;
          howlerBank[pCount].play();
        }
      };

      playsFiles.forEach((current) => {
        const howler = new Howl({
          src: [current],
          volume: volume || 1,
          onend,
          onplayerror: (_, error) => {
            throw new Error(error)
          },
        })
        howlerBank.push(howler)
      });

      howlerBank[0].play();
    } else {
      let playFile = file;
      if (regexBase64.test(file)) {
        playFile = "data:audio/wav;base64," + file
      } else if (!file.startsWith('http')) {
        playFile = `${window.location.origin}/media/${file}`
      }

      new Howl({
        src: [playFile],
        autoplay: true,
        volume: volume || 1,
        onend: () => {},
        onplayerror: (_, error) => {
          throw new Error(error)
        },
      });
    }
  })
})