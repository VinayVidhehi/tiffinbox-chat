// services/messageService.js
const supabase = require('../dbconnection');  // Adjust path as needed

// Function to store message in the database when recipient is offline
const storeMessageInDB = async (senderId, recipientId, message) => {
  try {
    // Example query for storing the message in a PostgreSQL database (adjust for your DB)
    const { data, error } = await supabase
      .from('messages')  // Assuming you have a 'messages' table
      .insert([
        {
          sender_id: senderId,
          recipient_id: recipientId,
          message: message,
          timestamp: new Date(),
          delivered: false,  // Set delivered flag as false initially
        }
      ]);

    if (error) {
      console.error('Error storing message in DB:', error);
      throw error;
    }

    return data;  // Return stored message or some status as needed
  } catch (err) {
    console.error('Error in storing message:', err);
    throw err;  // Throw the error to be handled by the calling function
  }
};

module.exports = { storeMessageInDB };
