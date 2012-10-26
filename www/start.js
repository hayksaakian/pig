app.initialize();
socket.on('news', function (data) {
	console.log('testing the socket.io');
  console.log(data);
  socket.emit('my other event', { my: 'data' });
});