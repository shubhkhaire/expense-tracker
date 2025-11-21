const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const devController = require("../controllers/devController");

router.use(bodyParser.json());

router.post("/seed", devController.seed);

module.exports = router;
