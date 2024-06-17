import express from "express";
import { logger } from "firebase-functions";
import { getUsers } from "../common/users";
import axios from "axios";
import fs from "fs";

const router = express.Router();
//get current date
const date = new Date();
const day = date.getDate();
const month = date.getMonth() + 1;
const year = date.getFullYear();
const currentDate = `${day}/${month}/${year}`;

interface Shift {
    name: string;
    work: string;
}

interface DailySchedule {
    day: number;
    month: number;
    year: number;
    MorningShift: Shift[];
    AfternoonShift: Shift[];
}

interface ParsedData {
    answer: string;
    join: string;
}

function parseJsonL(jsonLString: String) {
    const jsonObjects = [];
    let currentObjectString = "";
  
    // Iterate through each character in the string
    for (let i = 0; i < jsonLString.length; i++) {
      currentObjectString += jsonLString[i];
  
      // Check if the current character completes a JSON object
      if (jsonLString[i] === '}' && i < jsonLString.length - 1 && jsonLString[i + 1] === '{') {
        try {
          const parsedObject = JSON.parse(currentObjectString);
          jsonObjects.push(parsedObject);
        } catch (error) {
          console.error('Error parsing JSON object:', error);
        }
        currentObjectString = "";
        i++; // Skip the next '{' in the split pattern
      }
    }
  
    // Parse the last object
    if (currentObjectString.trim() !== "") {
      try {
        const parsedObject = JSON.parse(currentObjectString);
        jsonObjects.push(parsedObject);
      } catch (error) {
        console.error('Error parsing JSON object:', error);
      }
    }
    return 
}
router.get("/timetable", async (req, res) => {
  try {
    const fields = ["name", "uid"];
    const userResponse = await getUsers(fields);
    if (userResponse.status !== 200) {
      return res.status(userResponse.status).json(userResponse.error);
    }
    console.log(userResponse.data);
    
    const users = userResponse.data;
    const userList = users ? users.map(user => `{"name": "${user.name}", "uid": "${user.uid}"}`).join(", ") : "";

    const options = {
        method: 'GET',
        url: 'https://chat-gpt-43.p.rapidapi.com/',
        params: {question: `This job is Create the new timetable for users [${userList}].Data should be created for the next month, starting from today(${currentDate}) Exclude the weekends. Each user can only work 8 hours per day and no more then 42 hours a week. THe minimum shift time should be 4 hours. Users need to get at least 36 hours a week work scheduled therefore as many as needed can be scheduled for any shift. At least two people need to work the same shift daily. Same worker can't work 2 shifts in a day and no more than 9 hours. The business opens at 7 and closes at 23. The business is closed on sundays. Provide data for the next 5  days. Here's the example format in which data should be returned: {"day":15,"month":6,"year":2024,"MorningShift":[{"name":"Janez","work":"8-12"},{"name":"Testni","work":"7-15"}],"AfternoonShift":[{"name":"Maja","work":"12-20"},{"name":"Testni","work":"15-21"}]}{"day":16,"month":6,"year":2024,"MorningShift":[{"name":"Jakob","work":"8-16"},{"name":"Igor","work":"8-16"}],"AfternoonShift":[{"name":"Testni","work":"13-21"},{"name":"Maja","work":"13-21"}]} ONLY RETURN THE JSON AS A RESPONSE. DO NOT RETURN ANYTHING ELSE. USE THE USERS I PROVIDED. The structure should be the same as in the example and format of return should be JSON. Do not forget the outermost brackets [] and the commas between each entry. Provide the smart schedule for the next 5 days (working week). Do not generate it only for 1 day. Seriuosly, do not return anything else. `
    },
        headers: {
        'x-rapidapi-key': 'c2d191dce4msh7f530aafe69c7a0p1d2f73jsn91c7a42e7f2c',
        'x-rapidapi-host': 'chat-gpt-43.p.rapidapi.com'
        }
    };

    const mockApiResponse ="{\n  \"day\": 16,\n  \"month\": 6,\n  \"year\": 2024,\n  \"MorningShift\": [\n    {\n      \"name\": \"Jakob\",\n      \"work\": \"8-16\"\n    },\n    {\n      \"name\": \"Igor\",\n      \"work\": \"8-16\"\n    }\n  ],\n  \"AfternoonShift\": [\n    {\n      \"name\": \"Testni\",\n      \"work\": \"13-21\"\n    },\n    {\n      \"name\": \"Maja\",\n      \"work\": \"13-21\"\n    }\n  ]\n}{\n  \"day\": 17,\n  \"month\": 6,\n  \"year\": 2024,\n  \"MorningShift\": [\n    {\n      \"name\": \"Janez\",\n      \"work\": \"8-16\"\n    },\n    {\n      \"name\": \"Maja\",\n      \"work\": \"8-16\"\n    }\n  ],\n  \"AfternoonShift\": [\n    {\n      \"name\": \"Marko\",\n      \"work\": \"13-21\"\n    },\n    {\n      \"name\": \"Katja\",\n      \"work\": \"13-21\"\n    }\n  ]\n}{\n  \"day\": 18,\n  \"month\": 6,\n  \"year\": 2024,\n  \"MorningShift\": [\n    {\n      \"name\": \"Marko\",\n      \"work\": \"8-16\"\n    },\n    {\n      \"name\": \"Katja\",\n      \"work\": \"8-16\"\n    }\n  ],\n  \"AfternoonShift\": [\n    {\n      \"name\": \"Igor\",\n      \"work\": \"13-21\"\n    },\n    {\n      \"name\": \"Jakob\",\n      \"work\": \"13-21\"\n    }\n  ]\n}{\n  \"day\": 20,\n  \"month\": 6,\n  \"year\": 2024,\n  \"MorningShift\": [\n    {\n      \"name\": \"Janez\",\n      \"work\": \"8-16\"\n    },\n    {\n      \"name\": \"Maja\",\n      \"work\": \"8-16\"\n    }\n  ],\n  \"AfternoonShift\": [\n    {\n      \"name\": \"Marko\",\n      \"work\": \"13-21\"\n    },\n    {\n      \"name\": \"Katja\",\n      \"work\": \"13-21\"\n    }\n  ]\n}{\n  \"day\": 21,\n  \"month\": 6,\n  \"year\": 2024,\n  \"MorningShift\": [\n    {\n      \"name\": \"Marko\",\n      \"work\": \"8-16\"\n    },\n    {\n      \"name\": \"Katja\",\n      \"work\": \"8-16\"\n    }\n  ],\n  \"AfternoonShift\": [\n    {\n      \"name\": \"Igor\",\n      \"work\": \"13-21\"\n    },\n    {\n      \"name\": \"Jakob\",\n      \"work\": \"13-21\"\n    }\n  ]\n}";


    try {
        logger.warn("question", options.params.question)
        const response = await axios.request(options);
        const jsonLAnswer: string = response.data.answer;
        logger.warn("-----------------")
        console.log("mockApiResponse", mockApiResponse)
        console.log("-----------------")
       /*  // Split the JSON objects
        const jsonObjects = jsonLAnswer.split('}{');

        // Initialize an array to hold the formatted JSON objects
        const formattedJsonArray = [];

        // Add the necessary braces back to each JSON object and parse it
        for (let i = 0; i < jsonObjects.length; i++) {
            let jsonStr = jsonObjects[i];
            if (i !== 0) jsonStr = '{' + jsonStr;
            if (i !== jsonObjects.length - 1) jsonStr += '}';

            try {
                const parsedJson = JSON.parse(jsonStr);
                formattedJsonArray.push(parsedJson);
            } catch (error) {
                console.error('Error parsing JSON:', error);
                console.log('JSON string causing the issue:', jsonStr);
                res.status(400).json({ error: 'Invalid JSON format' });
                return; // Exit the function after sending the response
            }
        }

        // Convert the array of objects to a pretty-printed JSON string
        const prettyJson = JSON.stringify(formattedJsonArray, null, 4);

        // Write the pretty-printed JSON to a file
        */
       const filename = 'parsed_json_output.json';
        fs.writeFile(filename, jsonLAnswer, (err) => {
            if (err) {
                console.error('Error saving file:', err);
            } else {
                console.log(`The parsed JSON has been successfully written to '${filename}'`);
            }
        });
        res.status(200).json(jsonLAnswer);
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred");
    }

  } catch (error) {
    console.log(error);
    res.status(500).send("An error occurred");
  }
});

module.exports = router;
