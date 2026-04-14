/**
 * Email retry utility for handling failed email sends with exponential backoff
 */

export async function sendEmailWithRetry(emailFunction, maxRetries = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await emailFunction();
      if (result) {
        console.log(`Email sent successfully on attempt ${attempt}`);
        return true;
      }
    } catch (error) {
      lastError = error;
      console.error(`Email send attempt ${attempt} failed:`, {
        error: error.message,
        code: error.code,
        command: error.command
      });
      
      // Don't retry on certain error types
      if (error.code === 550 || error.code === 551 || error.code === 553) {
        console.log('Permanent email error detected, not retrying');
        return false;
      }
    }
    
    // If this is the last attempt, don't wait
    if (attempt < maxRetries) {
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.log(`Waiting ${delay}ms before retry ${attempt + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.error(`Email failed after ${maxRetries} attempts. Last error:`, lastError?.message);
  return false;
}

export async function retryFailedEmails() {
  // This function can be called periodically to retry failed emails
  // Implementation would depend on your database structure for tracking failed emails
  console.log('Email retry service initialized');
}
