class Join {

    _programingLanguage;

    _userName;

    _roomId;

    constructor(programingLanguage, userName, roomId) {
        this._programingLanguage = programingLanguage;
        this.userName = userName;
        this.roomId = roomId;
    }

    get programingLanguage() {
        return this._programingLanguage;
    }
    set programingLanguage(value) {
        this._programingLanguage = value;
    }

    get userName() {
        return this._userName;
    }
    set userName(value) {
        this._userName = value;
    }

    get roomId() {
        return this._roomId;
    }
    set roomId(value) {
        this._roomId = value;
    }

    getArguments(){
        Object.assign(this);
    }

}

module.exports = Join;