import { Howl } from 'howler';
import { EvntCom } from 'evntcom-js';

const regexBase64 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

const NAME = 'media'

window.addEventListener('load', function () {
  let websocket
  if (import.meta.env.MODE === 'development') {
    websocket = new EvntCom(NAME, 5000, 'localhost')
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('host') && urlParams.get('port')) {
      websocket = new EvntCom(NAME, parseInt(urlParams.get('port'), 10), urlParams.get('host'))
    } else {
      websocket = new EvntCom(NAME)
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