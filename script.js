import { Howl } from 'howler';
import io from 'socket.io-client';

const regexBase64 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

window.addEventListener('load', function () {
  let url
  if (import.meta.env.MODE === 'development') {
    url = '127.0.0.1:5000'
  } else {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('host')) {
      url = urlParams.get('host')
    } else {
      url = window.location.origin
    }
  }

  const socket = io(url, { path: '/ws' });
  socket.on('play', ({file, uniqueId, volume}) => {
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
        if (newCount >= howlerBank.length) {
          socket.emit(`play-${uniqueId}`);
        } else {
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
            socket.emit(`play-error-${uniqueId}`, error)
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

      const sound = new Howl({
        src: [playFile],
        autoplay: true,
        volume: volume || 1,
        onend: () => {
          socket.emit(`play-${uniqueId}`)
        },
        onplayerror: (_, error) => {
          socket.emit(`play-error-${uniqueId}`, error)
        },
      });
      sound.play();
    }
  })
})