/* import request from 'supertest';
import express from 'express';
import nock from 'nock';
import axios from 'axios';
import { getUsers } from '../definitions/classes/users'; // Adjust the path accordingly
 */
const request = require('supertest');
const express = require('express');
const nock = require('nock');
const axios = require('axios');
const { getUsers } = require('../definitions/classes/users'); // Adjust the path accordingly

jest.mock('axios');
jest.mock('../definitions/classes/users');

const app = express();
app.use(express.json());

// Define your endpoint directly in the test file or import it if defined elsewhere
app.get('/timetable', async (req, res) => {
  try {
    const usersResponse = await getUsers();
    if (usersResponse.status !== 200) {
      throw new Error('Failed to fetch users');
    }

    const options = {
      method: 'GET',
      url: 'https://chat-gpt-43.p.rapidapi.com/',
      params: { question: 'your question' },
      headers: {
        'X-RapidAPI-Key': '4c18557083msh649943c48ac5cb5p182612jsnc5a2eb1ac508',
        'X-RapidAPI-Host': 'chat-gpt-43.p.rapidapi.com',
      },
    };

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await axios.request(options);
        const jsonLAnswer = response.data.answer;
        if (!jsonLAnswer || jsonLAnswer.includes("I'm sorry") || jsonLAnswer.trim() === '') {
          throw new Error('API returned an error or empty response');
        }
        // SaveToFirestore(jsonLAnswer, endDate); // Mock this if needed
        return res.status(200).json(JSON.parse(jsonLAnswer));
      } catch (error) {
        if (attempt === 2) {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

describe('GET /timetable', () => {
  afterEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  it('should return a successful response with mocked data', async () => {
    const mockUsers = [
      { name: 'John Doe', uid: '1' },
      { name: 'Jane Smith', uid: '2' },
      { name: 'Marko Jovanovic', uid: '3' },
    ];

    const mockApiResponse = `[ {"day":17,"month":6,"year":2024,"MorningShift":[{"name":"Monika","work":"7-11","uid":"VJiNzZKySdh4HR5mG3OGrPPkDYB3"},{"name":"Marko","work":"7-11","uid":"WANhbgdZozW7b48DPWP9"}],"AfternoonShift":[{"name":"Igor","work":"11-19","uid":"WtntIWe4iuRaUJEW3lq4"},{"name":"Janez","work":"11-19","uid":"0LDxbiOCX1YWLaHqesI7"}]}, {"day":18,"month":6,"year":2024,"MorningShift":[{"name":"Jakob","work":"7-11","uid":"ebRi8pmxCgQzxRuJyPCx"},{"name":"Katja","work":"7-11","uid":"WsfuGD2jMdCSCAfOvLn0"}],"AfternoonShift":[{"name":"Maja","work":"11-19","uid":"HXJqPIFnnArd4XsTFjtn"},{"name":"Monika","work":"11-19","uid":"VJiNzZKySdh4HR5mG3OGrPPkDYB3"}]}, {"day":19,"month":6,"year":2024,"MorningShift":[{"name":"Igor","work":"7-11","uid":"WtntIWe4iuRaUJEW3lq4"},{"name":"Marko","work":"7-11","uid":"WANhbgdZozW7b48DPWP9"}],"AfternoonShift":[{"name":"Janez","work":"11-19","uid":"0LDxbiOCX1YWLaHqesI7"},{"name":"Jakob","work":"11-19","uid":"ebRi8pmxCgQzxRuJyPCx"}]}, {"day":20,"month":6,"year":2024,"MorningShift":[{"name":"Katja","work":"7-11","uid":"WsfuGD2jMdCSCAfOvLn0"},{"name":"Maja","work":"7-11","uid":"HXJqPIFnnArd4XsTFjtn"}],"AfternoonShift":[{"name":"Monika","work":"11-19","uid":"VJiNzZKySdh4HR5mG3OGrPPkDYB3"},{"name":"Igor","work":"11-19","uid":"WtntIWe4iuRaUJEW3lq4"}]}, {"day":21,"month":6,"year":2024,"MorningShift":[{"name":"Marko","work":"7-11","uid":"WANhbgdZozW7b48DPWP9"},{"name":"Janez","work":"7-11","uid":"0LDxbiOCX1YWLaHqesI7"}],"AfternoonShift":[{"name":"Jakob","work":"11-19","uid":"ebRi8pmxCgQzxRuJyPCx"},{"name":"Katja","work":"11-19","uid":"WsfuGD2jMdCSCAfOvLn0"}]} ]`;

    // Mock the external API request
    nock('https://chat-gpt-43.p.rapidapi.com')
      .get('/')
      .query(true)
      .reply(200, { answer: mockApiResponse });

    // Mock the getUsers function to avoid hitting the actual service
    getUsers.mockResolvedValue({
      status: 200,
      data: mockUsers,
    });

    const res = await request(app).get('/timetable');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(JSON.parse(mockApiResponse));
  });

  it('should return a 500 error if the API response is invalid', async () => {
    // Mock the external API request to return an invalid response
    nock('https://chat-gpt-43.p.rapidapi.com')
      .get('/')
      .query(true)
      .reply(200, { answer: '' });

    // Mock the getUsers function to avoid hitting the actual service
    getUsers.mockResolvedValue({
      status: 200,
      data: [],
    });

    const res = await request(app).get('/timetable');

    expect(res.status).toBe(500);
    expect(res.text).toBe('An error occurred');
  });
});
