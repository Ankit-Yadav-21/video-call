import express from "express";
import helmet from 'helmet';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';

const app = express();
app.use(helmet());
app.use(logger('dev'));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;