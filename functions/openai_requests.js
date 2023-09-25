import Bard from 'bard-ai';
import { HfInference } from '@huggingface/inference';
import { writeFileSync, createWriteStream, readFileSync } from 'fs';
import os from 'os';
import { config } from 'dotenv';
// import { getRecentMessages } from './database';
config();
const callBardApi = async (input) => {
  try {
    const BARD_API_KEY = process.env.BARD_API_KEY;
    console.log('BARD KEY', BARD_API_KEY);
    let context = process.env.BARD_CONTEXT
      ? process.env.BARD_CONTEXT
      : `Can you please set context for you as Spanish Teacher and teach one word at a time, max words in response should be 30
      Do not send any images or links`;
    let myBard = new Bard(BARD_API_KEY, {
      context: context,
    });
    console.log('BARD input', input);
    let bardInput;
    if (!input) {
      bardInput = context;
    } else {
      bardInput = input;
    }

    console.log(`BARD bardInput ${bardInput}`);
    const bardResponse = await myBard.ask(bardInput, {
      format: 'json',
    });
    // const bardResponse = await myBard.ask({
    //   message: `${bardInput}`,
    //   format: 'json',
    // });
    return bardResponse?.content;
  } catch (err) {
    console.error('Error occurred in calling BARD API', err);
  }
};

const huggingFaceConversation = async (inputMessage) => {
  let bardInput;
  if (!inputMessage) {
    bardInput =
      'Can you please set context for you as French Teacher and teach one word at a time';
  } else {
    bardInput = inputMessage;
  }
  const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
  const inference = new HfInference(HF_ACCESS_TOKEN);
  const chat = await inference.conversational({
    model: 'microsoft/DialoGPT-medium',
    inputs: {
      text: bardInput,
    },
    parameters: {
      max_length: 30,
      temperature: 70,
    },
  });

  console.log('chat asr response', chat);
  return chat;
};

function toArrayBuffer(buffer) {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

const convertAudioToText = async (audioFile) => {
  try {
    console.log('TEMP DIR', os.tmpdir());
    console.log('audioFile', audioFile);
    const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN;
    const inference = new HfInference(HF_ACCESS_TOKEN);
    const buffer = readFileSync(audioFile.path);
    console.log(buffer instanceof Buffer);
    const arrayBuffer = toArrayBuffer(buffer);

    const chat = await inference.automaticSpeechRecognition({
      data: arrayBuffer,
      model: 'microsoft/speecht5_asr',
    });

    console.log('chat asr response', chat);
    return chat;
  } catch (err) {
    console.error('Error occurred in calling HUGGING FACE API', err);
  }
};

export {
  callBardApi as openApiCall,
  convertAudioToText as audioToText,
  huggingFaceConversation as huggingCall,
};
