// Import necessary modules
const request = require('supertest');
const express = require('express');
const axios = require('axios');
const nock = require('nock');
jest.mock('../definitions/classes/users', () => ({
  getUsers: jest.fn() // Mocking getUsers function
}));
// Import getUsers from the module
const { getUsers } = require('../definitions/classes/users');

describe('GET /example', () => {
  afterEach(() => {
    jest.clearAllMocks(); // Clear all mocks after each test case
  });

  it('should return successful response with mocked data', async () => {
    const mockUsersResponse = {
      status: 200,
      data: [{ id: 1, name: 'John Doe' }, { id: 2, name: 'Jane Smith' }]
    };
    getUsers.mockResolvedValueOnce(mockUsersResponse); // Mock getUsers response

    // Make request to the endpoint
    const response = await request(app).get('/example');

    // Assertions
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: mockUsersResponse.data });
    expect(getUsers).toHaveBeenCalledTimes(1); // Ensure getUsers was called once
  });

  it('should return 500 error if getUsers fails', async () => {
    getUsers.mockRejectedValueOnce(new Error('Failed to fetch users')); // Mock getUsers to simulate failure

    // Make request to the endpoint
    const response = await request(app).get('/example');

    // Assertions
    expect(response.status).toBe(500);
    expect(response.text).toBe('An error occurred');
    expect(getUsers).toHaveBeenCalledTimes(1); // Ensure getUsers was called once
  });
});
