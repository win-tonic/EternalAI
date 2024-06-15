import express from 'express';
import cors from 'cors';
import { router } from './router/router';
import dotenv from 'dotenv';
import { customBodyParser } from './middleware/bodyParser';
dotenv.config();

const port = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(customBodyParser)
app.use(router);

app.listen(port, () => {  
    console.log(`Server is running on http://localhost:${port}/`);
});