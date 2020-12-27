const express = require('express');
const app = express();
const nPortNumber = process.env.PORT || 3000;

// const server = app.listen(nPortNumber, () => console.log(`Listening at port: ${nPortNumber}`))
const server = app.listen(nPortNumber)

app.use ('/', express.static('public'))