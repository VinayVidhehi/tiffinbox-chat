const supabase = require('../dbconnection'); // Adjust path as needed

// Helper function to determine suffix for user ID
const addUserTypeSuffix = (userId, isCustomer) => {
  return isCustomer ? `${userId}c` : `${userId}v`;
};

// Function to store message in the database when recipient is offline
const storeMessageInDB = async (senderId, recipientId, message, isCustomer) => {
  try {
    // Add suffixes to IDs
    const formattedSenderId = addUserTypeSuffix(senderId, isCustomer);
    const formattedRecipientId = addUserTypeSuffix(recipientId, isSenderCustomer);

    // Store message in the database
    const { data, error } = await supabase
      .from('messages') // Assuming you have a 'messages' table
      .insert([
        {
          senderId: formattedSenderId,
          recipientId: formattedRecipientId,
          message: message,
        },
      ]);

    if (error) {
      console.error('Error storing message in DB:', error);
      throw error;
    }

    return data; // Return stored message or some status as needed
  } catch (err) {
    console.error('Error in storing message:', err);
    throw err; // Throw the error to be handled by the calling function
  }
};

module.exports = { storeMessageInDB };
