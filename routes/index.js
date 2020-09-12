var express = require('express');
var router = express.Router();

/* Pressing the 'PLAY' button, returns the game page */
router.get("/play", function(req, res) {
  res.sendFile("game.html", { root: "./public" });
});

module.exports = router;
