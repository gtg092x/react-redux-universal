import express from 'express';
import webpackMiddleware from 'webpack-dev-middleware';
import webpack from 'webpack';
import config from './webpack.config';
import appServer from './index.server';

const app = express();

app.use('/dist', webpackMiddleware(webpack(config)));
app.get('/favicon.ico', (req, res) => res.end());
app.use(appServer);

app.listen(3000);
