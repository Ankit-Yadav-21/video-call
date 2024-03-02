import { useRef } from "react";
import * as mediasoupClient from "mediasoup-client";
import { socket } from "../../components/socket";

export const useMediasoup = () => {
   type Params = {
    encodings: { rid: string; maxBitrate: number; scalabilityMode: string }[];
    codecOptions: { videoGoogleStartBitrate: number };
    track?: any;
  };

  let params: Params = {
    encodings: [
      {
        rid: "r0",
        maxBitrate: 100000,
        scalabilityMode: "S1T3",
      },
      {
        rid: "r1",
        maxBitrate: 300000,
        scalabilityMode: "S1T3",
      },
      {
        rid: "r2",
        maxBitrate: 900000,
        scalabilityMode: "S1T3",
      },
    ],
    codecOptions: {
      videoGoogleStartBitrate: 1000,
    },
  };

  let device: any;
  let producerTransport: any;
  let producer: any;
  let consumerTransport: any;
  let rtpCapabilities: any;
  let consumer: any;
  let isProducer: Boolean;
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);

  const streamSuccess = (stream:any) => {
    if(localVideoRef.current){
      localVideoRef.current.srcObject = stream
    }
    const track = stream.getVideoTracks()[0]
    params = {
      track,
      ...params
    }
  
    goConnect(true)
  }

  const goProduce = () => {
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: {
          min: 640,
          max: 1920,
        },
        height: {
          min: 400,
          max: 1080,
        }
      }
    })
    .then(streamSuccess)
    .catch(error => {
      console.log(error.message)
    })
  }

  const goConsume = () => {
    goConnect(false)
  }

  const goConnect = (producerOrConsumer:any) => {
    isProducer = producerOrConsumer
    device === undefined ? getRtpCapabilities() : goCreateTransport()
  }

  const goCreateTransport = () => {
    isProducer ? createSendTransport() : createRecvTransport()
  }

  const createDevice = async () => {
    try {
      device = new mediasoupClient.Device()
      await device.load({
        routerRtpCapabilities: rtpCapabilities
      })

      goCreateTransport()

    } catch (error:any) {
      if (error.name === 'UnsupportedError')
        console.warn('browser not supported')
    }
  }

  const getRtpCapabilities = () => {
    socket.emit('getRtpCapabilities', (data:any) => {
      rtpCapabilities = data.rtpCapabilities
      createDevice()
    })
  }

  const createSendTransport = () => {
    socket.emit('createWebRtcTransport', { sender: true }, ({ params }:any) => {
      if (params.error) {
        console.log(params.error)
        return
      }

      producerTransport = device.createSendTransport(params)

      producerTransport.on('connect', async ({ dtlsParameters }:any, callback:any, errback:any) => {
        try {
          await socket.emit('transport-connect', {
            dtlsParameters,
          })

          callback()
        } catch (error) {
          errback(error)
        }
      })

      producerTransport.on('produce', async (parameters:any, callback:any, errback:any) => {
        try {
          await socket.emit('transport-produce', {
            kind: parameters.kind,
            rtpParameters: parameters.rtpParameters,
            appData: parameters.appData,
          }, ({ id }:any) => {
            callback({ id })
          })
        } catch (error) {
          errback(error)
        }
      })

      connectSendTransport()
    })
  }

  const connectSendTransport = async () => {
    producer = await producerTransport.produce(params)

    producer.on('trackended', () => {
      console.log('track ended')
    })

    producer.on('transportclose', () => {
      console.log('transport ended')
    })
  }

  const createRecvTransport = async () => {
    await socket.emit('createWebRtcTransport', { sender: false }, ({ params }:any) => {
      if (params.error) {
        console.log(params.error)
        return
      }

      consumerTransport = device.createRecvTransport(params)

      consumerTransport.on('connect', async ({ dtlsParameters }:any, callback:any, errback:any) => {
        try {
          await socket.emit('transport-recv-connect', {
            dtlsParameters,
          })

          callback()
        } catch (error) {
          errback(error)
        }
      })

      connectRecvTransport()
    })
  }

  const connectRecvTransport = async () => {
    await socket.emit('consume', {
      rtpCapabilities: device.rtpCapabilities,
    }, async ({ params }:any) => {
      if (params.error) {
        console.log('Cannot Consume')
        return
      }

      consumer = await consumerTransport.consume({
        id: params.id,
        producerId: params.producerId,
        kind: params.kind,
        rtpParameters: params.rtpParameters
      })

      const { track } = consumer

      if(remoteVideoRef.current){
        remoteVideoRef.current.srcObject = new MediaStream([track])
      }
      socket.emit('consumer-resume')
    })
  }

  return {
    remoteVideoRef,
    localVideoRef,
    goProduce,
    goConsume
  };
};
