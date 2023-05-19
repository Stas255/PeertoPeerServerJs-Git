class User {

    _socketId;

    _name;

    constructor(socketId, name) {
        this._socketId = socketId;
        this._name = name;
    }

    get socketId() {
        return this._socketId;
    }

    get name() {
        return this._name;
    }

    static IsConnected(io) {
        return io.sockets.connected[userSocket.id] !== undefined;
    }
}

module.exports = User;