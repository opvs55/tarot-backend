import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { devAuthMock } from './middlewares/devAuthMock.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';
import healthRoutes from './routes/healthRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import natalChartRoutes from './routes/natalChartRoutes.js';
import oracleRoutes from './routes/oracleRoutes.js';
import unifiedReadingRoutes from './routes/unifiedReadingRoutes.js';
import debugRoutes from './routes/debugRoutes.js';

export const app = express();

const allowedOrigins = env.frontendUrl === '*' ? true : [env.frontendUrl];
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(devAuthMock);

app.use('/api/v1', healthRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', natalChartRoutes);
app.use('/api/v1', oracleRoutes);
app.use('/api/v1', unifiedReadingRoutes);
app.use('/api/v1', debugRoutes);

app.use(notFound);
app.use(errorHandler);
