const express = require("express");
const cors = require("cors");
const { StaticTokenProvider } = require("aws-sdk");
const app = express();
const conditions = ['burn', 'fire', 'smoke', 'injured', 'hurt', 'pain'];
app.use(cors());
app.use(express.json());
require("dotenv").config()
var client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_TOKEN)

app.get("/", (req, res) => {  
  res.send("This is the server... why are you here??");
});

app.use((req, res, next) => {
  res.status(404).send("404 - Not Found");
});

async function call(address, condition, extraText){
  if (extraText) condition = "having a " + condition;
  await client.calls.create({
    twiml: `<Response><Say>Someone is ${condition}, we need an ambulance as soon as possible, the incident is at ${address}</Say></Response>`,
    to: '+14372555840',
    from: '+18285200175'
  })
}

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

function findWords(sentence, wordList) {
  let pattern = wordList.join("|");
  let regex = new RegExp(pattern, "gi");
  let matches = sentence.match(regex);
  return matches;
}

app.post("/transcript", async (req, res) => {
  const transcript = req.body.transcript;
  const condition = findWords(transcript, conditions);
  const lat = req.body.lat
  const long = req.body.long
  let address
  if(lat && long){
   address = await calculateAddress(lat,long)
  }else{
    address = ""
  }
  console.log("Received transcript:", transcript);

  let isEmergency = false;
  let instructions = "";
  let extraText = false;
  switch (condition) {
    case "heart attack":
        instructions = "Please stay calm and take deep breaths. If you have aspirin, take it. If you have nitroglycerin, take it. If you have a heart condition, take your prescribed medication. Emergency Services have been contacted.";
        isEmergency = true;
        extraText = true;
      break;
    case "stroke":
        instructions = "If someone is having a stroke, recognize the signs using FAST (Face drooping, Arm weakness, Speech difficulty, Time to call emergency) and call emergency services immediately for professional medical care. Stay with the person, keep them calm, and do not give them anything to eat or drink. Emergency Services have been contacted.";
        isEmergency = true;
        extraText = true;
      break;
    case "first degree burn":
        instructions = "Run cool water over the area for 3-5 minutes. Take an over-the-counter pain reliever. Apply an antibiotic ointment. Cover the burn with a sterile bandage.";
        extraText = true;
      break;
    case "second degree burn":
        instructions = "Run cool water over the area for 3-5 minutes. Take an over-the-counter pain reliever. Apply an antibiotic ointment. Cover the burn with a sterile bandage. Emergency Services have been contacted.";
        isEmergency = true;
        extraText = true;
      break;
    case "third degree burn":
        instructions = "Do NOT apply water, ointments, or ice. Cover the burn with a sterile bandage. Emergency Services have been contacted.";
        isEmergency = true; 
        extraText = true;
      break;
    case "burn":
        instructions = "Run cool water over the area for 3-5 minutes. Take an over-the-counter pain reliever. Apply an antibiotic ointment. Cover the burn with a sterile bandage.";
        extraText = true;
      break;
    case "nose bleed":
        instructions = "Sit down and lean forward. Pinch your nose and breathe through your mouth. Apply an ice pack to your nose. If the bleeding doesn't stop after 20 minutes, call emergency services.";
        extraText = true; 
      break;
    case "seizure":
        instructions = "Move any nearby objects away from the person. Place the person on their side after the seizure ends. Stay with the person until they are fully alert. Emergency Services have been contacted.";
        isEmergency = true;
        extraText = true;
      break;
    case "choking":
        instructions = "Perform the Heimlich maneuver. If the person is unable to breathe, call emergency services.";
        isEmergency = true;
      break;
    case "fainted not breathing":
        instructions = "Lay the person on their back and elevate their legs. Emergency services have been contacted.";
        isEmergency = true;
      break;
    case "fainted":
        instructions = "Lay the person on their back and elevate their legs. If the person is not breathing, call emergency services.";
      break;
    case "broken bone":
        instructions = "Immobilize the injured area. Apply ice to the injured area. Emergency Services have been contacted.";
        isEmergency = true;
        extraText = true;
      break;
    case "sprained ankle":
        instructions = "Rest the ankle. Ice the ankle. Compress the ankle. Elevate the ankle.";
        extraText = true;
      break;
    case "concussion":
        instructions = "Rest and avoid physical activity. Apply ice to the injured area. Emergency Services have been contacted.";
        isEmergency = true;
        extraText = true;
      break;
    case "cut":
        instructions = "Apply pressure to the cut with a clean cloth. If the bleeding doesn't stop after 20 minutes, call emergency services.";
        extraText = true;  
      break;
    case "big cut":
        instructions = "Apply pressure to the cut with a clean cloth. Do not remove the cloth. Continue to add more cloths if needed. Emergency Services have been contacted.";
        isEmergency = true;
        extraText = true;
      break;
    case "bleeding internally":
        instructions = "Lay the person on their back and elevate their legs. Emergency Services have been contacted.";
        isEmergency = true;
      break;
    case "internal bleeding":
        instructions = "Lay the person on their back and elevate their legs. Emergency Services have been contacted.";
        isEmergency = true;
      break;
    case "bleeding":
        instructions = "Apply pressure to the cut with a clean cloth. If the bleeding doesn't stop after 20 minutes, call emergency services.";
      break;
    deafault:
      instructions = "I did not understand. Can you please explain again?"
  }

  if (isEmergency) {
    call(address, condition, extraText)
    res.json({ message: instructions, transcript: transcript });
  }

}, (error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: "Error processing transcript: " + error });
});
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

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;