const request = require('supertest');
const express = require('express');
const { logger } = require('firebase-functions');
const { db } = require('../config/firestoreConfig');

jest.mock('../config/firestoreConfig', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
  },
}));

jest.mock('firebase-functions', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

const app = express();
app.use(express.json());

app.get('/users/:uid', async (req, res) => {
  logger.info(req.method + ' ' + req.originalUrl);
  logger.info('GET /users/:uid');
  try {
    const uid = req.params.uid;
    const user = await db.collection('users').doc(uid).get();
    if (!user.exists) {
      return res.status(404).send('User not found');
    }
    res.status(200).json(user.data());
  } catch (error) {
    res.status(500).send(error.message);
    logger.error('Error getting user:', error);
  }
});

describe('GET /users/:uid', () => {
  it('should return 200 and the user data if the user exists', async () => {
    const mockUserData = { name: 'John', surname: 'Doe' };
    db.get.mockResolvedValueOnce({
      exists: true,
      data: () => mockUserData,
    });

    const response = await request(app).get('/users/12345');
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockUserData);
  });

  it('should return 404 if the user does not exist', async () => {
    db.get.mockResolvedValueOnce({
      exists: false,
    });

    const response = await request(app).get('/users/12345');
    expect(response.status).toBe(404);
    expect(response.text).toBe('User not found');
  });

  it('should return 500 if there is a server error', async () => {
    db.get.mockRejectedValueOnce(new Error('Internal Server Error'));

    const response = await request(app).get('/users/12345');
    expect(response.status).toBe(500);
    expect(response.text).toBe('Internal Server Error');
  });
});
