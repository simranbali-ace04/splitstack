const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

async function handleRegister(req, res){
    try{
    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(400).json({message: "All fields are required"});
    }
    const existingUser = await User.findOne({email});
    if(existingUser){
        return res.status(409).json({message: "User already exists"});
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({name, email, password: hashedPassword});
    return res.status(201).json({
        message: "User registered successfully", 
        user: user._id,
    });
    } catch (error) {
        return res.status(500).json({message: "Internal server error"});
    }
} 

async function handleLogin(req, res){
    try {const {email, password} = req.body;
    if(!email || !password){
        return res.status(400).json({message: "Email and password are required"});
    }
    const user = await User.findOne({email});
    if(!user){
        return res.status(401).json({message: "Invalid credentials"});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
        return res.status(401).json({message: "Invalid credentials"});
    }
    const token = jwt.sign({
        id: user._id,
        email: user.email,
    }, process.env.JWT_SECRET, { expiresIn: "1h" });
    return res.status(200).json({ message: "Login successful", token });
} catch (error) {
    return res.status(500).json({message: "Internal server error"});
}
}
module.exports = {  
    handleRegister,
    handleLogin,
}
