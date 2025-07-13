// Get DOM elements
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

const worker_url =
  "https://loreal-chatbot-worker.sorayazapatarocha.workers.dev/";

// Set initial welcome message
chatWindow.innerHTML =
  '<div class="msg ai">👋 Hello! How can I help you today?</div>';

// Store chat history as an array of messages
let messages = [
  {
    role: "system",
    content:
      "You are a helpful assistant for L’Oréal. Only answer questions related to L’Oréal products, beauty routines, and product recommendations. If a question is not about L’Oréal products or beauty advice, politely respond that you can only assist with L’Oréal-related topics.",
  },
];

// Function to add a message to the chat window
// Simple markdown to HTML converter for basic formatting
function renderMarkdown(text) {
  // Bold **text** or __text__
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__(.*?)__/g, "<strong>$1</strong>");
  // Italic *text* or _text_
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  text = text.replace(/_(.*?)_/g, "<em>$1</em>");
  // Inline code `code`
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  // Links [text](url)
  text = text.replace(
    /\[(.*?)\]\((.*?)\)/g,
    '<a href="$2" target="_blank">$1</a>'
  );
  // Line breaks for double newlines (paragraphs)
  text = text.replace(/\n\n/g, "</p><p>");
  // Line breaks for single newline
  text = text.replace(/\n/g, "<br>");
  // Wrap in <p> if not already
  if (!/^<p>/.test(text)) text = "<p>" + text + "</p>";
  return text;
}

// Function to add a message to the chat window
function addMessage(text, sender) {
  // sender: 'user' or 'ai'
  const msgDiv = document.createElement("div");
  msgDiv.className = `msg ${sender}`;
  if (sender === "ai") {
    // Render markdown for AI messages
    msgDiv.innerHTML = renderMarkdown(text);
  } else {
    msgDiv.textContent = text;
  }
  chatWindow.appendChild(msgDiv);
  chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}

// Handle form submit
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user input and clear the input box
  const userText = userInput.value.trim();
  if (!userText) return;
  userInput.value = "";

  // Add user message to chat window
  addMessage(userText, "user");

  // Add user message to messages array
  messages.push({ role: "user", content: userText });

  // Show loading message
  addMessage("Thinking...", "ai");

  // Call OpenAI API
  try {
    // Use the deployed Cloudflare Worker endpoint
    const apiUrl = worker_url;

    // Prepare the request body
    const body = {
      model: "gpt-4o",
      messages: messages,
      max_tokens: 300,
    };

    // Make the API request using fetch and async/await
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Remove the loading message
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }

    // Get the assistant's reply
    const aiReply =
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
        ? data.choices[0].message.content.trim()
        : "Sorry, I couldn't get a response. Please try again.";

    // Add AI message to chat window
    addMessage(aiReply, "ai");

    // Add AI message to messages array
    messages.push({ role: "assistant", content: aiReply });
  } catch (error) {
    // Remove the loading message
    const loadingMsg = chatWindow.querySelector(".msg.ai:last-child");
    if (loadingMsg && loadingMsg.textContent === "Thinking...") {
      chatWindow.removeChild(loadingMsg);
    }
    addMessage("Sorry, there was an error connecting to the AI.", "ai");
    console.error(error);
  }
});
