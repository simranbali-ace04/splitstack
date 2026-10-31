const Express = require("express");
const router = Express.Router();
const {handleRegister, handleLogin, handleLogout} = require("../controllers/auth.controller");

router.post("/register", handleRegister);
router.post("/login", handleLogin);
router.post("/logout", handleLogout);

module.exports = router;