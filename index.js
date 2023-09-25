// Server
import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import {
  openApiCall,
  audioToText,
  huggingCall,
} from './functions/openai_requests.js';
import { textToAudio } from './functions/text_to_speech.js';
import { storeMessages, clearStoredMessages } from './functions/database.js';
import { Buffer } from 'buffer';
import { PassThrough } from 'stream';
import os from 'os';
import multer from 'multer';
import { Readable } from 'stream';
import fs from 'fs';
import { createWriteStream } from 'fs';
import wavefile from 'wavefile';

config();

const app = express();
app.use(express.json()); //Used to parse JSON bodies
app.use(cors());
// app.use(express.urlencoded()); //Parse URL-encoded bodies
const PORT = process.env.PORT || 5005;
const upload = multer({ dest: './tmp' });

app.get('/callapi', async (req, res) => {
  const apiResponse = await openApiCall();
  // Store messages
  await storeMessages(apiResponse);
  return res.json(apiResponse);
});

app.get('/callhugapi', async (req, res) => {
  const apiResponse = await huggingCall();
  // Store messages
  // await storeMessages(apiResponse);
  return res.json(apiResponse);
});

app.get('/audio-to-text', async (req, res) => {
  const chatResponse = await audioToText();
  return res.json(chatResponse);
});

app.get('/reset', async (req, res) => {
  const reset = await clearStoredMessages();
  return res.send('Cleared stored messages');
});

app.post('/set-bard-context', async (req, res) => {
  const bardContext = req.body.context;
  console.log(' bardContext:', bardContext);
  process.env.BARD_CONTEXT = bardContext;
  return res.send('set bard context');
});

app.post('/set-bard-key', async (req, res) => {
  const bardKey = req.body.bardKey;
  console.log('BARD KEY from API:', bardKey);
  process.env.BARD_API_KEY = bardKey;
  return res.send('set bard key');
});

app.post('/audio-to-text', upload.single('file'), async (req, res) => {
  const audioFile = req.file;
  const chatResponse = await audioToText(audioFile);
  return res.json(chatResponse);
});

app.post('/text-to-audio', async (req, res) => {
  console.log('REQ', req.body);
  const message = req.body.msg;
  const speechResponse = await textToAudio(message);
  return res.json(speechResponse);
});

function limitString(string = '', limit = 205) {
  return string.substring(0, limit);
}

// API call from front end
app.post('/post-audio', upload.single('file'), async (req, res) => {
  console.log('FE call');
  const audioFile = req.file;
  const chatResponse = await audioToText(audioFile);
  if (!chatResponse) {
    console.error('No chat response audio to text error');
  }

  let bardResponse = await openApiCall(chatResponse.text);

  console.log('BARD RESPONSE IS:', bardResponse);
  if (!bardResponse) {
    console.error('No  response from BARD APi ');
    bardResponse = 'Sorry Not able to process request, please check settings';
  }
  bardResponse = limitString(bardResponse);
  console.log('BARD RESPONSE after limit:', bardResponse);
  // Store messages
  await storeMessages(chatResponse.text, bardResponse);
  const audioDataBuffer = await textToAudio(bardResponse);
  console.log('audioDataURI', audioDataBuffer);
  // const audioBuffer = Buffer.from(response.data, 'binary');
  const base64Audio = audioDataBuffer.toString('base64');
  const audioDataURI = `data:audio/mpeg;base64,${base64Audio}`;
  // return audioDataURI;

  // const streamResponse = new Response(speechResponseBuffer);

  // const stream = new Readable();
  // stream.push(speechResponseBuffer);
  // stream.push(null);
  // stream.pipe(createWriteStream(`generated.mp3`));
  res.set('Content-Type', 'application/octet-stream');
  res.write(audioDataBuffer);
  // const writeStream = WritableStream.getWriter();
  // res.send({ data: base64Audio });
  res.end();
  // const data = "Using streams to write data.";

  // speechResponse.pipeThrough

  // const bufferStream = new PassThrough();
  // bufferStream.end(Buffer.from(speechResponse));
  // resolve(bufferStream);
  // res.set({
  //   'Content-Type': 'audio/mpeg',
  //   'Transfer-Encoding': 'chunked',
  // });
  // bufferStream.pipe(res);

  // const fileStream = fs.createReadStream(speechResponse);
  // speechResponse.on('data', () => {
  //   // res.attachment('streamed-sample-data.csv');
  //   res.set('Content-Type', 'application/octet-stream');
  //   speechResponse.pipe(res);
  // });
  // speechResponse.on('error', (err) => {
  //   next(err);
  // });

  // res.set('Content-Type', 'application/octet-stream');

  // return res.json(chatResponse);
});

// app.get('/asr', async (req, res) => {
//   const buffer = readFileSync('./new.mp3');
//   console.log(buffer instanceof Buffer);
//   const arrayBuffer = toArrayBuffer(buffer);

//   const chat = await inference.automaticSpeechRecognition({
//     data: arrayBuffer,
//     model: 'microsoft/speecht5_asr',
//   });

//   console.log('chat asr response', chat);
//   res.end();
// });

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
