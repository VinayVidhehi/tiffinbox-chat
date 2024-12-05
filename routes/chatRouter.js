const express = require("express");
const supabase = require("../dbconnection");
const jwt = require("jsonwebtoken");
const verifyJWT = require("../jwtMiddleware");
const errorCodes = require("../errorCodes");
const handleDBError = require("../dbErrorHandler");
const router = express.Router();
require('dotenv').config();

// Function to retrieve messages when the vendor is the receiver
router.get('/retrieve-vendor-messages', verifyJWT , async (req, res) => {
  const {vendorId} = req.user; // Vendor's ID from JWT token
  const senderId = req.query.customerId; // Sender ID from the query parameter
  
  // Concatenate 'v' to the vendor ID (vendorId will be used as receiverId)
  const receiverId = `${vendorId}v`;

  // Concatenate 'c' to the senderId (senderId should be customer with 'c' suffix)
  const fullSenderId = `${senderId}c`; 

  try {
    // Retrieve messages where senderId is customer and receiverId is the vendor
    const { data, error } = await supabase
      .from('messages') // Assuming the table name is 'messages'
      .select('*')
      .or(
        `senderId.eq.${fullSenderId},receiverId.eq.${receiverId}`
      )
      .order('timestamp', { ascending: true }); // Order messages by timestamp

    if (error) {
      console.error('Error retrieving messages:', error);
      return res.status(500).json({ error: 'An error occurred while retrieving messages.' });
    }

    // Send the retrieved messages
    res.json({ messages: data });
  } catch (err) {
    console.error('Error in message retrieval:', err);
    res.status(500).json({ error: 'Failed to retrieve messages.' });
  }
});

// Function to retrieve messages when the customer is the receiver
router.get('/retrieve-customer-messages', verifyJWT, async (req, res) => {
    const {customerId} = req.user; // Customer's ID from JWT token
    const senderId = req.query.vendorId; // Sender ID from the query parameter
    
    // Concatenate 'c' to the customer ID (customerId will be used as receiverId)
    const receiverId = `${customerId}c`;
  
    // Concatenate 'v' to the senderId (senderId should be vendor with 'v' suffix)
    const fullSenderId = `${senderId}v`;
  
    try {
      // Retrieve messages where senderId is vendor and receiverId is the customer
      const { data, error } = await supabase
        .from('messages') // Assuming the table name is 'messages'
        .select('*')
        .or(
          `sender_id.eq.${fullSenderId},receiver_id.eq.${receiverId}`
        )
        .order('timestamp', { ascending: true }); // Order messages by timestamp
  
      if (error) {
        console.error('Error retrieving messages:', error);
        return res.status(500).json({ error: 'An error occurred while retrieving messages.' });
      }
  
      // Send the retrieved messages
      res.json({ messages: data });
    } catch (err) {
      console.error('Error in message retrieval:', err);
      res.status(500).json({ error: 'Failed to retrieve messages.' });
    }
  });
  
// Function to delete messages based on messageIds
router.delete('/delete-messages', verifyJWT, async (req, res) => {
    const { messageIds } = req.body; // Expecting an array of messageIds in the request body
  
    if (!messageIds || messageIds.length === 0) {
      return res.status(400).json({ error: 'No messageIds provided' });
    }
  
    try {
      // Delete messages from the database
      const { data, error } = await supabase
        .from('messages') // Assuming the table name is 'messages'
        .delete()
        .in('messageId', messageIds); // Delete messages where id matches any in the provided list of messageIds
  
      if (error) {
        console.error('Error deleting messages:', error);
        return res.status(500).json({ error: 'An error occurred while deleting messages.' });
      }
  
      // Send a success response
      res.json({ message:"messages deleted successfully", success: true});
    } catch (err) {
      console.error('Error in message deletion:', err);
      res.status(500).json({ error: 'Failed to delete messages.' });
    }
  });
  

module.exports = router;