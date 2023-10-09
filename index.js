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
import {
  storeMessages,
  clearStoredMessages,
  getRecentMessages,
  getAllMessages,
} from './functions/database.js';
import { storeContext, getAllContext } from './functions/qna.js';
import multer from 'multer';
// import '@tensorflow/tfjs-core';
// import '@tensorflow/tfjs-backend-cpu';
import '@tensorflow/tfjs-node';
import * as qna from '@tensorflow-models/qna';

config();

let modelPromise = {};

modelPromise = qna.load();

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

app.get('/health', async (req, res) => {
  return res.json({ Health: 'UP' });
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

app.get('/messages', async (req, res) => {
  const messages = await getAllMessages();
  return res.send(messages);
});

app.get('/reset', async (req, res) => {
  const reset = await clearStoredMessages();
  return res.send('Cleared stored messages');
});

app.post('/qna', async (req, res) => {
  const tensorContext = await getAllContext();
  const tensorQuestion = req.body.question;
  console.log('tensor ctx', tensorContext);
  console.log('tensorQuestion', tensorQuestion);
  const model = await modelPromise;
  const answers = await model.findAnswers(tensorQuestion, tensorContext);
  console.log(answers);
  if (answers && answers.length > 0) {
    return res.send(answers[0].text);
  }
  return res.send('Not found');
});

app.post('/set-qna-context', async (req, res) => {
  const tensorContext = req.body.context;

  console.log('setting tensor ctx', tensorContext);
  await storeContext(tensorContext);
  return res.send('Saved qna context');
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

function limitString(string = '', limit = 505) {
  return string.substring(0, limit);
}

// API call from front end for qna
app.post('/post-question', upload.single('file'), async (req, res) => {
  console.log('FE call');
  const audioFile = req.file;
  const tensorQuestion = await audioToText(audioFile);
  let bardResponse;
  if (!tensorQuestion) {
    console.error('No chat response audio to text error');
    bardResponse =
      'Sorry Not able to understand at the moment, please check backend';
  }
  const tensorContext = await getAllContext();
  // still no bard response means we get response from tensor
  if (!bardResponse && tensorQuestion?.text) {
    // bardResponse = await openApiCall(chatResponse.text);

    // console.log('tensor ctx', tensorContext);
    console.log('tensorQuestion', tensorQuestion);
    const model = await modelPromise;
    const answers = await model.findAnswers(tensorQuestion.text, tensorContext);
    console.log('answers->', answers);
    if (answers && answers.length > 0) {
      bardResponse = answers[0].text;
    }
  }

  console.log('BARD RESPONSE IS:', bardResponse);

  if (!bardResponse) {
    console.error('No  response from BARD API ');
    bardResponse =
      'Sorry Not able to find an answer or please ask right question based on context, thanks';
  }

  const audioDataBuffer = await textToAudio(bardResponse);
  console.log('audioDataURI', audioDataBuffer);

  res.set('Content-Type', 'application/octet-stream');
  res.write(audioDataBuffer);

  res.end();
});

// API call from front end
app.post('/post-audio', upload.single('file'), async (req, res) => {
  console.log('FE call');
  const audioFile = req.file;
  const chatResponse = await audioToText(audioFile);
  let bardResponse;
  if (!chatResponse) {
    console.error('No chat response audio to text error');
    bardResponse =
      'Sorry Not able to understand at the moment, please check backend';
  }
  // still no bard response means we got response from hugging face
  if (!bardResponse && chatResponse?.text) {
    bardResponse = await openApiCall(chatResponse.text);
  }

  console.log('BARD RESPONSE IS:', bardResponse);

  if (!bardResponse) {
    console.error('No  response from BARD API ');
    bardResponse =
      'Sorry Not able to get response from AI, please check settings';
  }
  bardResponse = limitString(bardResponse);
  console.log('BARD RESPONSE after limit:', bardResponse);
  // Store messages
  if (chatResponse?.text && bardResponse) {
    await storeMessages(chatResponse.text, bardResponse);
  }

  const audioDataBuffer = await textToAudio(bardResponse);
  console.log('audioDataURI', audioDataBuffer);

  const base64Audio = audioDataBuffer.toString('base64');
  const audioDataURI = `data:audio/mpeg;base64,${base64Audio}`;

  res.set('Content-Type', 'application/octet-stream');
  res.write(audioDataBuffer);

  res.end();
});

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
