const mongoose = require("mongoose");
const readline = require("readline");

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/nandudb");
const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => console.log("✅ Connected to MongoDB (nandudb)"));

// Chat Schema & Model
const chatSchema = new mongoose.Schema({
  sender: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Chat = mongoose.model("Chat", chatSchema);

// CLI Interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to display chat history
async function showChatHistory() {
  const chats = await Chat.find().sort({ timestamp: 1 });
  console.log("\n🗨️ Chat History:");
  chats.forEach(c =>
    console.log(`${c.sender}: ${c.message} (${c.timestamp.toLocaleString()})`)
  );
}

// Function to display analytics
async function showAnalytics() {
  const result = await Chat.aggregate([
    { $group: { _id: "$sender", totalMessages: { $sum: 1 } } },
    { $sort: { totalMessages: -1 } }
  ]);

  console.log("\n📊 Message Analytics:");
  result.forEach(r => console.log(`${r._id}: ${r.totalMessages} messages`));
  if(result.length > 0) {
    console.log(`🏆 Most Active Sender: ${result[0]._id} (${result[0].totalMessages} messages)\n`);
  }
}

// Function to ask for new messages
function askMessage() {
  rl.question("👤 Enter your name (or 'exit' to quit): ", (sender) => {
    if(sender.toLowerCase() === "exit") {
      console.log("👋 Exiting chat...");
      rl.close();
      mongoose.connection.close();
      return;
    }

    rl.question("💬 Enter your message: ", async (message) => {
      if(message.toLowerCase() === "exit") {
        console.log("👋 Exiting chat...");
        rl.close();
        mongoose.connection.close();
        return;
      }

      // Save message
      await Chat.create({ sender, message });
      console.log("✅ Message saved!");

      // Show chat history + analytics
      await showChatHistory();
      await showAnalytics();

      // Ask for next message
      askMessage();
    });
  });
}

// Start the chat
askMessage();
