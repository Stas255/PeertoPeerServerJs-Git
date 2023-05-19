function test(params) {
    return "test";
}

function getInfor(socket) {
    socket.emit('getInformation');
}

function parseInfor(data) {
    console.log(data);
}