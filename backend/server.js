const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

connectDB()

const port = process.env.PORT || 5000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors());

app.use('/user', require('./routes/userRoutes'))
app.use('/coffee', require('./routes/coffeeRoutes'))
app.use('/', require('./routes/couponRoutes'))

app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));
