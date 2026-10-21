const Express = require("express");
const router = Express.Router();
const {handleRegister, handleLogin} = require("../controllers/auth.controller");

router.post("/register", handleRegister);

router.post("/login", handleLogin);

module.exports = router;