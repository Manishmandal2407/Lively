import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import {ENV} from "../lib/env.js"
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import cloudinary from "../lib/cloudinary.js";


export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // 1. Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // 2. Check existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // 3. Hash password ✅ FIXED
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      const savedUser = await newUser.save();
      generateToken(savedUser._id, res);
    

      // 6. Response
      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });

      //todo: send a welcome email to user
      

      try {
        await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL)
      } catch (error) {
        console.log("failed to send welcome email:", error)
      }

    } else {
      res.status(400).json({ message: "Invalid user data" });
}

  } catch (error) {
    console.error("Error in signup controller:", error); // ✅ FIXED
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => { 
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({message:"Email and password are required"})
  }
  try {
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isPasswordCorrect = await bcrypt.compare(password, user.password)
    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid credentials" });

    generateToken(user._id, res)

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic
    });
  } catch (error) {
    console.error("Error in login contoller:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
export const logout = (_, res) => {
  res.cookie("jwt", "", { maxAge: 0 });
  res.status(200).json({message:"Logged out successfully"})
}
 
export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    if (!profilePic) return res.status(400).json({ message: "profile pic is required" });

    const userId = req.user._id;

    const uploadResponse = await cloudinary.uploader.upload(profilePic)
    
    await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);

  } catch (error) {
    console.log("error in update profile:", error);
    res.status(500).json({message:"Internal server error"})
  }
}