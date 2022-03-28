const express = require("express");
const service = require("./service");

const routes = express.Router({
  mergeParams: true,
});

routes.post("/", async (req, res, next) => {
  try{
    const Response = await service.passControl(req.body);
    res.status(Response['code']);
    res.json(Response);
  }
  catch(err){
    if(err['code']){
      res.status(err['code']);
      res.json(err);
      return
    }

    const ErrObj = {
      status: 'Error',
      code: 400,
      data: err.message
    }
    res.status(ErrObj['code']);
    res.json(ErrObj);
  }

});

module.exports = {
  routes,
};
