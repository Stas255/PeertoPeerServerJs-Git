class WebUserInformation {

    _socketId;

    _name;

    _ipAdress;

    constructor(name, socketId, ipAdress) {
        this._socketId = socketId;
        this._name = name;
        this._ipAdress = ipAdress;
    }

    get socketId() {
        return this._socketId;
    }

    set socketId(socketsId) {
        this._socketId = socketsId;
    }

    get name() {
        return this._name;
    }

    set name(name) {
        this._name = name;
    }

    static IsConnected(io) {
        return io.sockets.connected[userSocket.id] !== undefined;
    }

    get ipAdress() {
        return this._ipAdress;
    }
    set ipAdress(value) {
        this._ipAdress = value;
    }

    getObject(){
        return {
            socketId : this._socketId,
            name: this._name,
            ipAdress: this._ipAdress,
        }
    }
}

module.exports = WebUserInformation;