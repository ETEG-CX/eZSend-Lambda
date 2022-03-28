const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const { routes: ezsendRoutes } = require("./ezsend/controller");

const config = {
  webhookSecret:
    typeof process.env.CONFIG_WEBHOOK_SECRET === "undefined"
        ? "[Inserir Webhook Secret]"
        : process.env.CONFIG_WEBHOOK_SECRET,
}


const app = express();

// Custom Basic Authorization check
app.use((req, res, next) => {
    
  // Authorization sent?
  if(!req.headers['x-api-key']) {
      const Response = {
        status: 'Unauthorized',
        code: 401,
        data: 'Missed Header [x-api-key]'
      }
      res.status(Response['code']);
      res.json(Response);
  }
  // Authorization valid?
  if(req.headers['x-api-key'] != config.webhookSecret) {
      const Response = {
        status: 'Unauthorized',
        code: 401,
        data: 'Invalid webhook Secret '
      }
      res.status(Response['code']);
      res.json(Response);
  }
  // Procceed
  return next();
})

app.use(bodyParser.json());
app.use(cors());
app.use("/ezsend", ezsendRoutes);

module.exports = app;



if (typeof process.env.ENV === "undefined") {
  // not running on Lambda - Probably Localy

  // start server (only for local development)
  const port = 3000;
  const server = app.listen(port, async () => {
    console.log("Server listening on port " + port);
  });
}
