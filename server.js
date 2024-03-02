const express = require("express");
const cors = require("cors");
const axios = require("axios");


const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config()
var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_TOKEN)

app.post("/transcribe",async  (req, res) => {
  const transcriptionText = req.body.TranscriptionText;
  console.log("Transcription:", transcriptionText);

  // Handle the transcription text as needed
  try {
    await axios.post("https://quickaid-server.vercel.app/transcript", { transcript: transcriptionText });
    res.sendStatus(200); // Success response to Twilio
  } catch (error) {
    console.error("Error:", error);
    res.sendStatus(500); // Error response to Twilio
  }
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


app.get('/contact', (req, res) => {
  res.status(200).json('Welcome, your app is working well');
});

app.get("/user/:id", (req, res) => {
  const userId = req.params.id;
  res.send(`User ID: ${userId}`);
});
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

app.post("/gif", (req, res) => {
  if (req.body.transcript === "burn") {
    res.json({
      message:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS_WF_JjUjuToNWN3WCU0f3RqFy3qDfhQTDnQ&usqp=CAU",
      transcript: req.body.transcript,
    });
  }
});

app.use((req, res, next) => {
  res.status(404).send("404 - Not Found");
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


module.exports = app