const express = require("express");
const cors = require("cors");
const axios = require("axios");
const http = require('http');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const AWS = require('aws-sdk');

app.use(cors());
app.use(express.json());
require("dotenv").config()
var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_TOKEN)

AWS.config.update({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const lexruntime = new AWS.LexRuntime();

io.on('connection', (socket) => {
  socket.on('message', (text) => {
    var params = {
      botAlias: process.env.BOT_ALIAS,
      botName: process.env.BOT_NAME,
      inputText: text,
      userId: process.env.USER_ID,
      sessionAttributes: {}
    };

    lexruntime.postText(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
      } else {
        socket.emit('message', data.message);
      }
    });
  });
});

app.post("/transcribe", (req, res) => {
  const transcriptionText = req.body.TranscriptionText;
  console.log("Transcription:", transcriptionText);
  // Handle the transcription text as needed
  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Hello, world!");
});

async function call(address){
  await client.calls.create({
    twiml: `<Response><Say>Someone is burned, we need an ambulance as soon as possible, the incident is at ${address}</Say><Record transcribe="true" timeout="30" transcribeCallback="https://quickaid-server.vercel.app/transcribe" /></Response>`,
    to: '+14372555840',
    from: '+18285200175'
  })
}

function calculateAddress(lat, long) {
  return fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`
  )
    .then((response) => response.json())
    .then((json) => json.display_name.split(",").slice(0,5).join(" "))
    .catch((error) => {
      console.error(error);
      return "Error: Unable to fetch address";
    });
}
app.post("/transcript", async (req, res) => {
  const transcript = req.body.transcript;
  const lat = req.body.lat
  const long = req.body.long
  const address = await calculateAddress(lat,long)
  console.log("Received transcript:", transcript);
  if (transcript === "burn") {
    call(address)
    res.json({ message: "Contacted Emergency Services", transcript: transcript });

    // try {
    //   const response = await axios.post("http://localhost:8080/gif", {
    //     transcript: "burn",
    //   });
    //   const gifUrl = response.data.message;
    //   res.json({
    //     message: "Transcript received",
    //     transcript: transcript,
    //     image: gifUrl,
    //   });
    // } catch (error) {
    //   console.error("Error fetching GIF:", error);
    //   res.status(500).json({ message: "Error fetching GIF" });
    // }
  } else {
    res.json({ message: "Transcript received", transcript: transcript,address:address });
  }
});

app.use((req, res, next) => {
  res.status(404).send("404 - Not Found");
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app