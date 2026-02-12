import express from 'express'

const router = express.Router();

router.get("/send", (req, res) => {
  res.send("send message endpoint")
})

router.get("/receive", (req, res) => {
  res.send("Receive message endpoint")
})

export default router

