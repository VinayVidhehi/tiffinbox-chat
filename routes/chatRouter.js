const express = require("express");
const supabase = require("../dbconnection");
const jwt = require("jsonwebtoken");
const verifyJWT = require("../jwtMiddleware");
const errorCodes = require("../errorCodes");
const handleDBError = require("../dbErrorHandler");
const router = express.Router();
require('dotenv').config();

// Function to retrieve messages when the vendor is the receiver
  router.get('/retrieve-vendor-messages', verifyJWT, async (req, res) => {
    const { vendorId } = req.user; // Vendor's ID from JWT token
    const receiverId = `${vendorId}v`; // Receiver ID for the vendor
  
    console.log(`Vendor ID: ${vendorId}`);
    console.log(`Receiver ID (Vendor): ${receiverId}`);
  
    try {
      console.log('Fetching messages for the vendor...');
      const { data: messages, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('receiverId', receiverId)
        .order('created_at', { ascending: true });
  
      if (messageError) {
        console.error('Error retrieving messages from the database:', messageError);
        return res.status(500).json({ error: 'An error occurred while retrieving messages.' });
      }
  
      if (!messages || messages.length === 0) {
        console.warn('No messages found for the vendor.');
        return res.status(200).json({ customers: [] });
      }
  
      console.log(`Total messages retrieved: ${messages.length}`);
      
      console.log('Grouping messages by customerId...');
      const groupedMessages = messages.reduce((acc, message) => {
        const customerId = message.senderId.replace(/c$/, ''); // Remove trailing "c"
        if (!acc[customerId]) {
          acc[customerId] = {
            customerId,
            messages: [],
          };
        }
        acc[customerId].messages.push(message);
        return acc;
      }, {});
  
      const customerIds = Object.keys(groupedMessages);
      console.log(`Unique customer IDs extracted: ${customerIds} and their type is ${typeof(customerIds?.[0])}`);
  
      if (customerIds.length === 0) {
        console.warn('No unique customers found in the messages.');
        return res.status(200).json({ customers: [] });
      }

      const parsedCustomerIds = customerIds.map((customerId) => {
        return parseInt(customerId, 10); // Convert customerId to integer
      })

      console.log(`Parsed customer IDs extracted: ${parsedCustomerIds} and their type is ${typeof(parsedCustomerIds?.[0])}`);
  
      console.log('Fetching customer details from the database...');
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('customerId, name, phoneNumber')
        .in('customerId', parsedCustomerIds);
  
      if (customerError) {
        console.error('Error retrieving customers from the database:', customerError);
        return res.status(500).json({ error: 'An error occurred while retrieving customer details.' });
      }
  
      console.log(`Customer details retrieved: ${customers.length} records`);
  
      console.log('Mapping customer details to grouped messages...');
      const result = customerIds.map((customerId) => {
        const customer = customers.find((cust) => cust.customerId == customerId) || {};
        const messagesForCustomer = groupedMessages[customerId]?.messages || [];
  
        console.log(`Customer ID: ${customerId}, Messages Count: ${messagesForCustomer.length}`);
        return {
          customerId,
          name: customer.name || 'Unknown',
          phoneNumber: customer.phoneNumber || 'Unknown',
          messages: messagesForCustomer,
        };
      });
  
      console.log('Final result prepared, sending response...');
      res.json({ customers: result });
    } catch (err) {
      console.error('Unexpected error occurred during message retrieval:', err);
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
          `senderId.eq.${fullSenderId},receiverId.eq.${receiverId}`
        )
        .order('created_at', { ascending: true }); // Order messages by timestamp
  
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