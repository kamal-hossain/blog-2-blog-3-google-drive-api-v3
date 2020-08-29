const express = require('express');
const app = express();

const PORT = 5000;

const fs = require('fs');

const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
let auth;

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Drive API.
  authorize(JSON.parse(content));
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
    auth = oAuth2Client;
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      auth = authoAuth2Client;
    });
  });
}

// Routes

// app.get('/testRoute', (req, res) => res.end('Hello from Server!'));

// Route for uploading a file
app.post('/uploadAFile', (req, res) => {
  var fileMetadata = {
    name: 'kamal-hossain',
  };
  var media = {
    mimeType: 'image/jpg',
    body: fs.createReadStream('./demo-files/kamal-hossain.jpg'),
  };
  // Authenticating drive API
  const drive = google.drive({ version: 'v3', auth });
  // Uploading Single image to drive
  drive.files.create(
    {
      resource: fileMetadata,
      media: media,
    },
    async (err, file) => {
      if (err) {
        // Handle error
        console.error(err.msg);

        return res
          .status(400)
          .json({ errors: [{ msg: 'Server Error try again later' }] });
      } else {
        // if file upload success then
        res.status(200).json({
          fileID: file.data.id,
        });
      }
    }
  );
});

// Route for downloading an image/file
app.get('/downloadAFile', (req, res) => {
  var dir = `./downloads`; // directory from where node.js will look for downloaded file from google drive

  var fileId = '13_Iq3ImCLQqBStDQ9ottLIJwxwlXkQpa'; // Desired file id to download from  google drive

  var dest = fs.createWriteStream('./downloads/kamal-hossain.jpg'); // file path where google drive function will save the file

  const drive = google.drive({ version: 'v3', auth }); // Authenticating drive API

  let progress = 0; // This will contain the download progress amount

  // Uploading Single image to drive
  drive.files
    .get({ fileId, alt: 'media' }, { responseType: 'stream' })
    .then((driveResponse) => {
      driveResponse.data
        .on('end', () => {
          console.log('\nDone downloading file.');
          const file = `${dir}/kamal-hossain.jpg`; // file path from where node.js will send file to the requested user
          res.download(file); // Set disposition and send it.
        })
        .on('error', (err) => {
          console.error('Error downloading file.');
        })
        .on('data', (d) => {
          progress += d.length;
          if (process.stdout.isTTY) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`Downloaded ${progress} bytes`);
          }
        })
        .pipe(dest);
    })
    .catch((err) => console.log(err));
});

// Route for downloading an image/file
app.delete('/deleteAFile', (req, res) => {
  var fileId = '1vuZs3N8qnevNEETCKnZQ5js0HOCpGTxs'; // Desired file id to download from  google drive

  const drive = google.drive({ version: 'v3', auth }); // Authenticating drive API

  // Deleting the image from Drive
  drive.files
    .delete({
      fileId: fileId,
    })
    .then(
      async function (response) {
        res.status(204).json({ status: 'success' });
      },
      function (err) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'Deletion Failed for some reason' }] });
      }
    );
});

app.listen(PORT, () => {
  console.log(`Node.js App running on port ${PORT}...`);
});
