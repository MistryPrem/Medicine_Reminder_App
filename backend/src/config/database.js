import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

const MONGO_OPTIONS = {
  maxPoolSize: 10, // Optimized for MongoDB Atlas M0 free tier (500 connections limit)
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4 // Use IPv4, skip IPv6 resolution delays
};

let isConnected = false;

export const connectDatabase = async () => {
  if (isConnected) {
    logger.info('Using existing database connection');
    return mongoose.connection;
  }

  try {
    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info('MongoDB Atlas connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error', { error: err.message });
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn('MongoDB disconnected. Retrying connection...');
    });

    mongoose.connection.on('reconnected', () => {
      isConnected = true;
      logger.info('MongoDB reconnected successfully');
    });

    await mongoose.connect(env.MONGODB_URI, MONGO_OPTIONS);
    isConnected = true;
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB Atlas', { error: error.message });
    throw error;
  }
};

export const disconnectDatabase = async () => {
  if (!isConnected) return;
  try {
    await mongoose.connection.close(false);
    isConnected = false;
    logger.info('MongoDB Atlas connection closed gracefully');
  } catch (error) {
    logger.error('Error closing MongoDB connection', { error: error.message });
  }
};

export const checkDatabaseHealth = () => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const state = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  return {
    status: state === 1 ? 'up' : 'down',
    state: states[state] || 'unknown',
    readyState: state
  };
};
