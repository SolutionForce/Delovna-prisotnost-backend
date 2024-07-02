import express from "express";
import { logger } from "firebase-functions";
import { getUsers } from "../definitions/classes/users";
import axios from "axios";
import { db } from "../config/firestoreConfig";

const router = express.Router();
const date = new Date();
const day = date.getDate();
const month = date.getMonth() + 1;
const year = date.getFullYear();
const currentWeek = date.getDay();
const currentDate = `${day}/${month}/${year}`;

interface Shift {
    name: string;
    work: string;
}
const addDays = (date: any, days: any) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date: any) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const SaveToFirestore = async (jsonLAnswer: any, starting_date: any) => {
  console.log(starting_date);

  // Convert start_date to a Date object if it's not already
  const startDate = new Date(starting_date);

  // Calculate new end_date by adding 7 days to start_date
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 5);

  // Calculate new start_date by adding 1 day to endDate
  const newStartDate = new Date(startDate);

  const newTimetable = {
      start_date: newStartDate,
      end_date: endDate,
      attendance: jsonLAnswer
  };

  await db.collection('timetables').add(newTimetable);

}

const getLastTimetable = async () => {
  const timetableResponse = await db.collection('timetables')
  .orderBy('end_date', 'desc')
  .limit(1)
  .get();
  let endDate = null;

    if (!timetableResponse.empty) {
        const timetable = timetableResponse.docs[0];
        const endDateTimestamp = timetable.data().end_date;
        endDate = endDateTimestamp.toDate();
    } else {
        endDate = new Date();
    }

    return endDate;
}

router.get("/timetable", async (req, res) => {  
  try {
    const fields = ["name", "uid"];
    const userResponse = await getUsers(fields);
    if (userResponse.status !== 200) {
      return res.status(userResponse.status).json(userResponse.error);
    }    
    const users = userResponse.data;
    const userList = users ? users.map(user => `{"name": "${user.name}", "uid": "${user.uid}"}`).join(", ") : "";
    const newStart = await getLastTimetable();
    newStart.setDate(newStart.getDate());
    
    const endDate = newStart;
    const otherDate = addDays(newStart, 5);

    


    const options = {
        method: 'GET',
        url: 'https://chat-gpt-43.p.rapidapi.com/',
        params: {question: `This job is Create the new timetable for users [${userList}].Data should be created for the next week, starting from ${newStart} until ${otherDate}  Exclude the weekends. The minimum shift time should be 4 hours. Users need to get at least 36 hours a week work scheduled therefore as many as needed can be scheduled for any shift. At least two people need to work the same shift daily. Same worker can't work 2 shifts in a day and no more than 9 hours. The business opens at 7 and closes at 23. The business is closed on sundays. Provide data for the next 7 days. Here's the example format in which data should be returned: {"day":15,"month":6,"year":2024,"MorningShift":[{"name":"Janez","work":"8-12", uid="xy"},{"name":"Testni","work":"7-15", uid="xafdsy"}],"AfternoonShift":[{"name":"Maja","work":"12-20", uid="xyasd"},{"name":"Testni","work":"15-21", uid="jbg"}]}{"day":16,"month":6,"year":2024,"MorningShift":[{"name":"Jakob","work":"8-16",uid="xy"},{"name":"Igor","work":"8-16", uid="wetf"}],"AfternoonShift":[{"name":"Testni","work":"13-21", uid="sdy"},{"name":"Maja","work":"13-21", uid="wrfsdf"}]} ONLY RETURN THE JSON AS A RESPONSE, use corresponding uid. DO NOT RETURN ANYTHING ELSE. USE THE USERS I PROVIDED. The structure should be the same as in the example and format of return should be JSON string meaning the response starts with a '[', the correct one. Do not forget the outermost brackets [] and the commas between each entry. Provide the smart schedule for the next 5 days. Do not generate it only for 1 day. Seriuosly, do not return anything else. You've done it before, do it again`
    },
        headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_API_KEY,
        'x-rapidapi-host': 'chat-gpt-43.p.rapidapi.com'

        }
    };

    try {
      logger.warn("question", options.params.question);
      let response;
      let jsonLAnswer;
      let retries = 3;
      let success = false;
  
      for (let attempt = 0; attempt < retries; attempt++) {
          try {
              response = await axios.request(options);
              jsonLAnswer = response.data.answer;
  
              console.log("FAIL: ", jsonLAnswer);
  
              if (!jsonLAnswer || jsonLAnswer.includes("I'm sorry") || jsonLAnswer.trim() === '') {
                  throw new Error('API returned an error or empty response');
              }
  
              success = true;
              break;
          } catch (error: any) {
              console.error(`Attempt ${attempt + 1} failed: ${error.message}`);
              if (attempt === retries - 1) {
                  throw new Error('All retry attempts failed');
              }
          }
      }
  
      if (success) {
          await SaveToFirestore(jsonLAnswer, endDate);
          res.status(200).json(jsonLAnswer);
      } else {
          res.status(500).send("An error occurred after multiple retries");
      }
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