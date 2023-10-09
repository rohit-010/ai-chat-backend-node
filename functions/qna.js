import fs from 'fs';

const file_name = 'stored_context.json';

const getAllContext = async () => {
  try {
    // console.log('json data', jsonData);
    const data = fs.readFileSync(file_name, 'utf8');
    console.log(data);
    // const dataArray = data.split;
    if (data) {
      return data;
    }

    return '';
  } catch (err) {
    console.error(err);
  }
};

const storeContext = async (context) => {
  try {
    fs.writeFileSync(file_name, context);
    // file written successfully
  } catch (err) {
    console.error(err);
  }
};

export { getAllContext, storeContext };
