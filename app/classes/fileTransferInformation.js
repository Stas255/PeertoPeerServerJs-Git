class FileTransferInformation {

    _unicId = '';

    _fromUser;

    _toUser;

    _fileName;

    _progress = 0;

    _isP2P;

    _fileSize = 0;

    constructor(fromUser, toUser, fileName, isP2P, fileSize) {
        this._fromUser = fromUser;
        this._toUser = toUser;
        this._fileName = fileName;
        this._isP2P = isP2P;
        this._fileSize = fileSize;
        this._unicId =  'fileTransfer_'+ Math.floor(Math.random() * 1000000);
    }

    get unicId() {
        return this._unicId;
    }

    get fromUser() {
        return this._fromUser;
    }
    set fromUser(value) {
        this._fromUser = value;
    }

    get toUser() {
        return this._toUser;
    }
    set toUser(value) {
        this._toUser = value;
    }

    get fileName() {
        return this._fileName;
    }
    set fileName(value) {
        this._fileName = value;
    }

    get progress() {
        return this._progress;
    }
    set progress(value) {
        this._progress = value;
    }

    get isP2P() {
        return this._isP2P;
    }
    set isP2P(value) {
        this._isP2P = value;
    }

    get fileSize() {
        return this._fileSize;
    }
    set fileSize(value) {
        this._fileSize = value;
    }

    getObject(){
        return {
            unicId : this._unicId,
            fromUser: this._fromUser,
            toUser: this._toUser,
            fileName: this._fileName,
            progress: this._progress,
            isP2P: this._isP2P,
        }
    }
}

module.exports = FileTransferInformation;