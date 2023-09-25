import { config } from 'dotenv';
import * as voice from 'elevenlabs-node';
import { HfInference } from '@huggingface/inference';
import axios from 'axios';
config();

// readChunks() reads from the provided reader and yields the results into an async iterable
function readChunks(reader) {
  return {
    async *[Symbol.asyncIterator]() {
      let readResult = await reader.read();
      while (!readResult.done) {
        yield readResult.value;
        readResult = await reader.read();
      }
    },
  };
}

const callHuggingFaceTextToSpeech = async (message) => {
  const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
  const inference = new HfInference(HF_ACCESS_TOKEN);
  try {
    const chat = await inference.textToSpeech({
      // model: 'microsoft/speecht5_tts',
      // model: 'mio/amadeus',
      // model: 'facebook/fastspeech2-en-ljspeech',
      // model: 'suno/bark',
      // model: 'Voicemod/fastspeech2-en-male1',
      model: 'Voicemod/fastspeech2-en-ljspeech', // female
      // model: 'Voicemod/fastspeech2-en-male1',
      inputs: `${message}`,
    });

    console.log('generated chat', chat);
    const arrayBuffer = await chat.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer, 'binary');
    return buffer;
  } catch (err) {
    console.error('Error occurred in callHuggingFaceTextToSpeech', err);
  }
};

const callElevenLabsApi = async (message) => {
  console.log('callElevenLabsApi: message->', message);
  try {
    // voice
    //   .textToSpeechStream(
    //     process.env.ELEVEN_LABS_API_KEY,
    //     process.env.ELEVEN_LABS_VOICE_ID,
    //     message,
    //     40,
    //     50,
    //     process.env.ELEVEN_LABS_MODEL_ID
    //   )
    //   .then((res) => {
    //     console.log('Eleven labs response:', res);
    //     // res.pipe(fs.createWriteStream('audio.mp3')).on('finish', () => {
    //     //   console.log('Finish writing audio stream');
    //     // });
    //   });

    // const voiceResponse = await voice.textToSpeechStream(
    //   process.env.ELEVEN_LABS_API_KEY,
    //   process.env.ELEVEN_LABS_VOICE_ID,
    //   message
    // );
    // return voiceResponse;

    const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY;
    console.log('ELEVEN_LABS_API_KEY ', ELEVEN_LABS_API_KEY);
    console.log('message ', message);

    const data = {
      text: `${message}`,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0,
        similarity_boost: 0,
      },
    };

    // console.log('DATA', data);
    // console.log('JSON DATA', JSON.stringify(data));
    // // # Define voice
    const voice_rachel = '21m00Tcm4TlvDq8ikWAM';
    const voice_settings = {
      stability: 0,
      similarity_boost: 0,
    };

    const ENDPOINT = `https://api.elevenlabs.io/v1/text-to-speech/${voice_rachel}`;

    // , {

    //   headers: {

    //   },
    //   body: JSON.stringify(data),

    // }

    const response = await axios.post(
      ENDPOINT,
      {
        text: `${message}`,
        voice_settings: voice_settings,
      },
      {
        headers: {
          'xi-api-key': ELEVEN_LABS_API_KEY,
          'Content-Type': 'application/json',
          accept: 'audio/mpeg',
        },
        responseType: 'arraybuffer',
      }
    );

    const audioBuffer = Buffer.from(response.data, 'binary');
    const base64Audio = audioBuffer.toString('base64');
    const audioDataURI = `data:audio/mpeg;base64,${base64Audio}`;
    return audioDataURI;

    // console.log('response in streams', response.body);
    // return response.body;
    // response.body is a ReadableStream
    // const reader = response.body.getReader();
    // return reader;
    // for await (const chunk of readChunks(reader)) {
    //   console.log(`received chunk of size ${chunk.length}`);
    // }
  } catch (err) {
    console.error('Error occurred in calling ELEVEN LABS API', err);
  }
};

export { callHuggingFaceTextToSpeech as textToAudio };
