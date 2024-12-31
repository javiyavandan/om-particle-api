import express from 'express';
import app from './src/config/app';

const startServer = async () => 
{
    const appExpress = express();
    app({app: appExpress});
}

startServer();