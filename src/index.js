const http = require("http");
const express = require("express");
const path = require("path");
const socketio = require("socket.io");
var Filter = require("bad-words");
const {
  generateMessage,
  generateLocationMessage,
} = require("./utils/messages");

const app = express();
const server = http.createServer(app);

const io = socketio(server);

const port = 3000 || process.env.PORT;
const publicDirectoryPath = path.join(__dirname, "../public");

app.use(express.static(publicDirectoryPath));

io.on("connection", (socket) => {


  socket.on("join", ({ username, room }, callback) => {
    socket.join(room);
    socket.emit("message", generateMessage("Welcome!"));
    socket.broadcast.to(room).emit("message", generateMessage(`${username} has joined!`));
  });



  socket.on("sendMessage", (message, callback) => {
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    io.emit("message", generateMessage(message));

    // callback();
    callback();
  });

  socket.on("location", (coords, callback) => {
    console.log(coords);
    io.emit(
      "locationMessage",
      generateLocationMessage(
        `https://www.google.com/maps?q=${coords.lat},${coords.long}`
      )
    );
    callback();
  });


  socket.on("disconnect", () => {
    io.emit("message", generateMessage("A user has left!"));
  });
});
server.listen(port, () => {
  console.log(`Server is up on port ${port}`);
});

/* 
-When we use socket.emit we are emitting the event to a particular connection.
-If i used io.emit here every time a new client joined all clients would get the count.
-I want to emit it to every single connection. So I used io.emit 
-When we broadcast an event :We send it to everybody except the current client.
-Event Acknowledgements in socketio ,example use case sending a location or a message the client sends the 
the msg or the loc to the server but it's never quite sure the server recevied it and actually did 
something,with and ack the client would get notified that the message or the location was indeed delivered
successfully  
-socket.join allows us to join a given chat room we pass to it the name of the room
socket.join we have two new setups we'll be using for emitting messages 
 1- io.to.emit : emit an event to everybody in a specific room  without sending it to people in other rooms
 2- socket.broadcast.to.emit : send an event to everyone in a specific room except the current client 

*/
