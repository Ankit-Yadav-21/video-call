import {config} from "./config";

let router:any;
let producerTransport:any;
let consumerTransport:any;
let producer:any;
let consumer:any;

const createWebRtcTransport = async (callback) => {
  try {
    let transport = await router.createWebRtcTransport(config.mediasoup.webRtcTransport)
    console.log(`transport id: ${transport.id}`)

    transport.on('dtlsstatechange', dtlsState => {
      if (dtlsState === 'closed') {
        transport.close()
      }
    })

    transport.on('close', () => {
      console.log('transport closed')
    })

    callback({
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      }
    })

    return transport
  } catch (error) {
    console.log(error)
    callback({
      params: {
        error: error
      }
    })
  }
}

module.exports = async function (socket:any, io:any, worker:any) {
  console.log(`Socket Connected`, socket.id);
  socket.emit('connected', socket.id)

  let mediaCodecs = config.mediasoup.router.mediaCodecs
  
  router = await worker.createRouter({ mediaCodecs })

  socket.on('getRtpCapabilities', (callback) => {
    const rtpCapabilities = router.rtpCapabilities
    callback({ rtpCapabilities })
  })

  socket.on('createWebRtcTransport', async ({ sender }, callback) => {
    if (sender){
      producerTransport = await createWebRtcTransport(callback)
    } else{
      consumerTransport = await createWebRtcTransport(callback)
    }
  })

  socket.on('transport-connect', async ({ dtlsParameters }) => {
    console.log('DTLS PARAMS... ', { dtlsParameters })
    await producerTransport.connect({ dtlsParameters })
  })

  socket.on('transport-produce', async ({ kind, rtpParameters, appData }, callback) => {
    producer = await producerTransport.produce({kind,rtpParameters})

    producer.on('transportclose', () => {
      console.log('transport for this producer closed ')
      producer.close()
    })

    callback({id: producer.id })
  })

  socket.on('transport-recv-connect', async ({ dtlsParameters }) => {
    console.log(`DTLS PARAMS: `, dtlsParameters)
    await consumerTransport.connect({ dtlsParameters })
  })

  socket.on('consume', async ({ rtpCapabilities }, callback) => {
    try {
      if (router.canConsume({producerId: producer.id,rtpCapabilities})) {
        consumer = await consumerTransport.consume({
          producerId: producer.id,
          rtpCapabilities,
          paused: true,
        })

        consumer.on('transportclose', () => {
          console.log('transport close from consumer')
        })

        consumer.on('producerclose', () => {
          console.log('producer of consumer closed')                
        })

        const params = {
          id: consumer.id,
          producerId: producer.id,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        }

        callback({ params })
      }
    } catch (error) {
      console.log(error.message)
      callback({
        params: {
          error: error
        }
      })
    }
  })

  socket.on('consumer-resume', async () => {
    console.log('consumer resume')
    await consumer.resume()
  })

  socket.on('disconnect',()=>{
    console.log('Socket Disconnected', socket.id);
  })
}