/* const request = require('supertest');
const express = require('express');
const { logger } = require('firebase-functions');
const { db } = require('../src/config/firestoreConfig');

jest.mock('../src/config/firestoreConfig', () => ({
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
 */
const request = require('supertest');
const express = require('express');
const { logger } = require('firebase-functions');
const { db } = require('../src/config/firestoreConfig');

jest.mock('../src/config/firestoreConfig', () => ({
  db: {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    add: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
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

// GET /users/:uid
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

// POST /users
app.post('/users', async (req, res) => {
  logger.info(req.method + ' ' + req.originalUrl);
  logger.info('POST /users');
  try {
    const userData = req.body;
    const newUserRef = await db.collection('users').add(userData);
    res.status(201).json({ id: newUserRef.id });
  } catch (error) {
    res.status(500).send(error.message);
    logger.error('Error creating user:', error);
  }
});

// PUT /users/:uid
app.put('/users/:uid', async (req, res) => {
  logger.info(req.method + ' ' + req.originalUrl);
  logger.info('PUT /users/:uid');
  try {
    const uid = req.params.uid;
    const updatedUserData = req.body;
    await db.collection('users').doc(uid).set(updatedUserData, { merge: true });
    res.status(200).send('User updated successfully');
  } catch (error) {
    res.status(500).send(error.message);
    logger.error('Error updating user:', error);
  }
});

// DELETE /users/:uid
app.delete('/users/:uid', async (req, res) => {
  logger.info(req.method + ' ' + req.originalUrl);
  logger.info('DELETE /users/:uid');
  try {
    const uid = req.params.uid;
    await db.collection('users').doc(uid).delete();
    res.status(200).send('User deleted successfully');
  } catch (error) {
    res.status(500).send(error.message);
    logger.error('Error deleting user:', error);
  }
});

describe('CRUD Operations for /users Endpoint', () => {
  it('should create a new user with POST /users', async () => {
    const newUser = { name: 'Jane', email: 'jane@example.com' };
    const mockNewUserRef = { id: 'new_user_id' };
    db.collection('users').add.mockResolvedValueOnce(mockNewUserRef);

    const response = await request(app)
      .post('/users')
      .send(newUser);
    
    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: mockNewUserRef.id });
  });

  it('should update an existing user with PUT /users/:uid', async () => {
    const uid = 'existing_user_id';
    const updatedUserData = { name: 'Updated Name' };
    db.collection('users').doc(uid).set.mockResolvedValueOnce();

    const response = await request(app)
      .put(`/users/${uid}`)
      .send(updatedUserData);
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('User updated successfully');
  });

  it('should delete an existing user with DELETE /users/:uid', async () => {
    const uid = 'existing_user_id';
    db.collection('users').doc(uid).delete.mockResolvedValueOnce();

    const response = await request(app)
      .delete(`/users/${uid}`);
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('User deleted successfully');
  });
});
