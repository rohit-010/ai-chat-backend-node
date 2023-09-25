import fs from 'fs';
// import jsonData from '..stored_data.json';

//  Define the file name and learn instructions
const file_name = 'stored_data.json';
const learn_instructions = {
  role: 'system',
  content:
    'You will be spanish teacher, will teach one word at a time also providing some context',
};

const getRecentMessages = async () => {
  //  Initialize messages
  const messages = [];
  //  Add a random element
  const x = Math.random();

  if (x < 0.5) {
    learn_instructions['content'] =
      learn_instructions['content'] +
      ' Your response will include some dry humour.';
  } else {
    learn_instructions['content'] =
      learn_instructions['content'] + ' Your response will include a facts';
  }
  messages.push(learn_instructions);

  //Get last messages

  try {
    // console.log('json data', jsonData);
    const data = fs.readFileSync(file_name, 'utf8');
    console.log(data);
    // const dataArray = data.split;
    if (data) {
      if (data.length < 5) {
        data.forEach((item) => {
          messages.push(item);
        });
      } else {
        console.log('Get last 5 items TODO');
      }
    }

    return messages;
  } catch (err) {
    console.error(err);
  }
};

function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

function toBuffer(data) {
  const arrayBuffer = new ArrayBuffer(data.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < data.length; ++i) {
    view[i] = data[i];
  }
  return ab2str(arrayBuffer);
}

// # Store messages
const storeMessages = async (request_message, response_message) => {
  // # Get recent messages
  const messages = await getRecentMessages();
  console.log('recent messages', messages);
  //  Add messages to data
  const user_message = { role: 'user', content: request_message };
  const assistant_message = { role: 'assistant', content: response_message };

  messages.push(user_message);
  messages.push(assistant_message);
  console.log('messages->', messages);
  const data = toBuffer(messages);
  console.log('Converted messages to  buffer');
  //  Save the updated file
  try {
    fs.writeFileSync(file_name, JSON.stringify(messages));
    // file written successfully
  } catch (err) {
    console.error(err);
  }
};

//Clear all stored messages
const clearStoredMessages = async () => {
  try {
    fs.writeFileSync(file_name, '');
    // file written successfully
  } catch (err) {
    console.error(err);
  }
};

export {
  storeMessages as storeMessages,
  getRecentMessages,
  clearStoredMessages,
};
