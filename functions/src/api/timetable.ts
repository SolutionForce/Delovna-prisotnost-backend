import express from "express";
import { logger } from "firebase-functions";
import { getUsers } from "../definitions/classes/users";
import axios from "axios";
import fs from "fs";
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
const addDays = (date:any, days:any) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const formatDate = (date:any) => {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  console.log("date", date, day, month, year)
  return `${day}/${month}/${year}`;
};

const SaveToFirestore = async (jsonLAnswer: any) => {
 
  const endDate = addDays(new Date(),5);
  const formattedEndDate = formatDate(endDate);

  const newTimetable = {
    start_date: currentDate,
    end_date: formattedEndDate,
    attendance: jsonLAnswer
  };
  console.log("newTimetable", newTimetable)
  await db.collection('timetables').add(newTimetable);


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
        params: {question: `This job is Create the new timetable for users [${userList}].Data should be created for the next month, starting from today(${currentDate}) Exclude the weekends. Each user can only work 8 hours per day and no more then 42 hours a week. THe minimum shift time should be 4 hours. Users need to get at least 36 hours a week work scheduled therefore as many as needed can be scheduled for any shift. At least two people need to work the same shift daily. Same worker can't work 2 shifts in a day and no more than 9 hours. The business opens at 7 and closes at 23. The business is closed on sundays. Provide data for the next 5  days. Here's the example format in which data should be returned: {"day":15,"month":6,"year":2024,"MorningShift":[{"name":"Janez","work":"8-12", id="xy"},{"name":"Testni","work":"7-15", id="xafdsy"}],"AfternoonShift":[{"name":"Maja","work":"12-20", id="xyasd"},{"name":"Testni","work":"15-21", id="jbg"}]}{"day":16,"month":6,"year":2024,"MorningShift":[{"name":"Jakob","work":"8-16",id="xy"},{"name":"Igor","work":"8-16", id="wetf"}],"AfternoonShift":[{"name":"Testni","work":"13-21", id="sdy"},{"name":"Maja","work":"13-21", id="wrfsdf"}]} ONLY RETURN THE JSON AS A RESPONSE. DO NOT RETURN ANYTHING ELSE. USE THE USERS I PROVIDED. The structure should be the same as in the example and format of return should be JSON. Do not forget the outermost brackets [] and the commas between each entry. Provide the smart schedule for the next 5 days (working week). Do not generate it only for 1 day. Seriuosly, do not return anything else. `
    },
        headers: {
        //'x-rapidapi-key': 'c2d191dce4msh7f530aafe69c7a0p1d2f73jsn91c7a42e7f2c',
        'x-rapidapi-key': '4c18557083msh649943c48ac5cb5p182612jsnc5a2eb1ac508', //switch those due to limit
        'x-rapidapi-host': 'chat-gpt-43.p.rapidapi.com'
        }
    };

    try {
        logger.warn("question", options.params.question)
        const response = await axios.request(options);
        const jsonLAnswer: string = response.data.answer;
        if (!jsonLAnswer || jsonLAnswer.includes("I'm sorry") || jsonLAnswer.trim() === '') {
          throw new Error('API returned an error or empty response');
        }
        SaveToFirestore(jsonLAnswer);
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
