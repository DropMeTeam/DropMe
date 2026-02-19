import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
    price: String,
    date: String,
    distance: String,
    rawText: String,      // Good for debugging if AI fails
    createdAt: { type: Date, default: Date.now }
});

// Using export default so you can import it easily in your controller
export default mongoose.model('Ticket', TicketSchema);