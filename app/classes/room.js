class Room {

    _users;

    constructor(users) {
        this._users = users;
    }

    get users() {
        return this._users;
    }
    set users(users) {
        this._users = users;
    }

    static IsConnected(io) {
        return io.sockets.connected[userSocket.id] !== undefined;
    }
}

module.exports = Room;