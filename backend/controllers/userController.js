import validator from "validator";
import bcrypt from "bcrypt";
import UserModel from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import userModel from "../models/UserModel.js";
import {v2 as cloudinary} from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import razorpay from "razorpay";

// API to register User

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.json({ success: false, message: "Please enter all fields" });
    if (!validator.isEmail(email))
      return res.json({ success: false, message: "Please enter valid email" });
    if (password.length < 8)
      return res.json({
        success: false,
        message: "Password should be atleast 8 characters long",
      });

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    // save user data to database
    const newUser = new UserModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//  API to login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get User Profile
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to update User Profile
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !address || !dob || !gender)
      return res.json({ success: false, message: "Please enter all fields" });

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if(imageFile){
      // upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"});
      const imageUrl = imageUpload.secure_url;

      await UserModel.findByIdAndUpdate(userId, {image: imageUrl});
    }

    res.json({ success: true, message: "Profile updated successfully" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to book an appointment
const bookAppointment = async (req, res) => {
  try {
    const {userId, docId, slotDate, slotTime} = req.body;
    const docData = await doctorModel.findById(docId).select("-password");
    if(!docData.available) return res.json({success: false, message: "Doctor not available"});

    const slots_booked = docData.slots_booked;

    // checking if slot is available
    if(slots_booked[slotDate]){
      if(slots_booked[slotDate].includes(slotTime)){
        return res.json({success: false, message: "Slot not available"});
      } else {
        slots_booked[slotDate].push(slotTime);
      }
    } else {
      slots_booked[slotDate] = [];
      slots_booked[slotDate].push(slotTime);
    }

    const userData = await userModel.findById(userId).select("-password");

    delete docData.slots_booked;

    const appointmentData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,	
      slotTime,
      slotDate,
      date: new Date(),
    };

    const newAppointment = new appointmentModel(appointmentData);
    await newAppointment.save();

    // save new slots data in docData
    await doctorModel.findByIdAndUpdate(docId, {slots_booked})
    res.json({success: true, message: "Appointment booked successfully"});

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// API to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
  try {
    const {userId} = req.body;
    const appointments = await appointmentModel.find({userId})
    res.json({success: true, appointments});
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}


// API to cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const {userId, appointmentId} = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if(appointmentData.userId !== userId) return res.json({success: false, message: "You are not authorized to cancel this appointment"});

    await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

    // releasing doctor slot
    const {docId, slotDate, slotTime} = appointmentData
    const doctorData = await doctorModel.findById(docId)

    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter(slot => slot !== slotTime);

    await doctorModel.findByIdAndUpdate(docId, {slots_booked});

    res.json({success: true, message: "Appointment cancelled successfully"});

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
}


export { registerUser, loginUser, getProfile, updateProfile, bookAppointment, listAppointment, cancelAppointment};
