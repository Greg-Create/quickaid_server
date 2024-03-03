const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
app.use(cors());
app.use(express.json());
require("dotenv").config()
var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_TOKEN)

app.get("/", (req, res) => {  
  res.send("This is the server... why are you here??");
});

async function call(address){
  await client.calls.create({
    twiml: `<Response><Say>Someone is burned, we need an ambulance as soon as possible, the incident is at ${address}</Say></Response>`,
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
async function calculateAddress(lat, long) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${long}`
    );
    const json = await response.json();
    return json.display_name.split(",").slice(0, 5).join(" ");
  } catch (error) {
    console.error(error);
    return "Error: Unable to fetch address";
  }
}
app.post("/transcript", async (req, res) => {
  const transcript = req.body.transcript;
  const lat = req.body.lat
  const long = req.body.long
  let address
  if(lat && long){
   address = await calculateAddress(lat,long)
  }else{
    address = ""
  }
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

module.exports = app;