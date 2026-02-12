import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
   const conn= await mongoose.connect(process.env.MONGODB_URI)
    console.log("MongoDB Connected", conn.connection.host)
  } catch (error) {
    console.log("Error connection to MONGODB:", error)
    process.exit(1); //1 status code means fail and 0 means pass

  }
}

export default connectDB;