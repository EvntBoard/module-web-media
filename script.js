import { Howl } from 'howler';
import { JSONRPCServerAndClient, JSONRPCServer, JSONRPCClient } from "json-rpc-2.0";

const regexBase64 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

const NAME = 'media'
const isDev = import.meta.env.MODE === 'development'

document.addEventListener('DOMContentLoaded', () => {
  document
    .getElementById('connect')
    .addEventListener('click', () => {
      let btn = document.getElementById('connect')
      btn.disabled = true;
      btn.innerText = "Connecting ...";

      const protocolPrefix = window.location.protocol === 'https:' ? 'wss:' : 'ws:';

      let webSocket
      if (isDev) {
        webSocket = new WebSocket(`${protocolPrefix}//localhost:5000/api-ws`);
      } else {
        webSocket = new WebSocket(`${protocolPrefix}//${window.location.host}/api-ws`);
      }

      const rpcServerAndClient = new JSONRPCServerAndClient(
        new JSONRPCServer(),
        new JSONRPCClient((request) => {
          try {
            webSocket.send(JSON.stringify(request));
          } catch (error) {
            console.error(error)
          }
          return Promise.resolve();
        })
      );

      rpcServerAndClient.addMethod("connected", () => {
        btn.innerText = "Connected";
        btn.disabled = true;
        rpcServerAndClient.notify('session.register', {
          name: 'module-web-media',
          module: NAME
        })
      })

      webSocket.onmessage = (event) => rpcServerAndClient.receiveAndSend(JSON.parse(event.data.toString()));

      // On close, make sure to reject all the pending requests to prevent hanging.
      webSocket.onclose = (event) => {
        btn.innerText = "Connect";
        btn.disabled = false;
        rpcServerAndClient.rejectAllPendingRequests(
          `Connection is closed (${event.reason}).`
        );
      };

      rpcServerAndClient.addMethod('play', async ([files, volume]) => {
        return new Promise((resolve, reject) => {
          if (Array.isArray(files) && files.length > 0) {
            const playsFiles = files.map((i) => {
              if (regexBase64.test(i)) {
                return "data:audio/wav;base64," + i
              } else if (!i.startsWith('http')) {
                let url = window.location.origin
                if (isDev) {
                  url = "localhost:5000";
                }
                return `${url}/${i}`
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
              } else {
                resolve(true)
              }
            };

            playsFiles.forEach((current) => {
              const howler = new Howl({
                src: [current],
                volume: volume || 1,
                onend,
                onloaderror: (_, error) => {
                  console.log(_, error)
                  reject(new Error("Error on load " + current + " " + error))
                },
                onplayerror: (_, error) => {
                  console.log(_, error)
                  reject(new Error("Error on play " + current + " " + error))
                },
              })
              howlerBank.push(howler)
            });
            howlerBank[0].play();
          } else {
            reject(new Error("Not valid payload"))
          }
        })
      })
    })
})