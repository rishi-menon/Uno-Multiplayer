const express = require('express');
const app = express();
const nPortNumber = 80;

const server = app.listen(nPortNumber, () => console.log(`Listening at port: ${nPortNumber}`))

app.use ('/', express.static('public'))