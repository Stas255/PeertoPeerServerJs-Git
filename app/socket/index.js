const socket = require("socket.io");

const fs = require("fs");

const path = require('path');

const { server } = require("../express");

const io = socket(server, {
    maxHttpBufferSize: 1e8 // 100 MB
});

const { plainToInstance, classToPlain } = require('class-transformer');

const { Join, Util, User, Room, WebUserInformation, FileTransferInformation } = require("../classes");

let rooms = []; //[roomId:{userId:{users:[{socketId:string, userName:string}]},shearedFiles:[{sockedId:string, fileName:string}]}]
rooms["test"] = {};

let streamFiles = []; //[{socketId:string, isServerLoad:boolean, chunks:[], chunkIndex:number, fileName:string, fileStream:FileStream, roomId:string, fileTransferInformation: FileTransferInformation}]]

let socketUsers = []; //[userId:[WebUserInformation]]

setInterval(checkWriteStreamFiles, 3000);

function checkWriteStreamFiles() {
    if (streamFiles.length != 0) {
        const roomWithFileTransferInformation = streamFiles.reduce((array, writeStreamFile) => {
            if (array[writeStreamFile.roomId] == null) {
                array[writeStreamFile.roomId] = [];
            }
            array[writeStreamFile.roomId].push(writeStreamFile.fileTransferInformation);
            return array;
        }, {});
        for (const roomName in roomWithFileTransferInformation) {
            const fileTransferInformations = roomWithFileTransferInformation[roomName].reduce((array, fileTransferInformation) => {
                if (array == null) {
                    array = [];
                }
                array.push(fileTransferInformation.getObject());
                return array;
            }, []);
            const users = rooms[roomName].users;
            users.forEach(user => {
                io.to(user.socketId).emit('emitFileTransferInformationsInRooms', { error: false, fileTransferInformationsInRooms: fileTransferInformations });
            })
        }
        console.log("test");
    }
}

io.on('connection', async socket => {
    console.log("New user connected");
    const originalOn = socket.on;
    socket.on = function (eventName, originalCallback) {
        // Modify args array or parse additional parameters here
        const modifiedCallback = function (...args) {
            // Extract the additional parameter from the args array
            if (args[0] && args[0].data != null) {
                args = args[0];
                if (socket.idIdentifier == null) {
                    socket.idIdentifier = args.idIdentifier;
                }
                return originalCallback.apply(this, args.data);
            }
            return originalCallback.apply(this, args);
        };

        // Call the original 'on' function with modified arguments
        return originalOn.apply(this, [eventName, modifiedCallback]);
    };
    socket.on('loginning', loginningInWeb);
    socket.on('disconnect', webUserDisconnect);
    socket.on('getListRooms', getListRooms);
    socket.on('createNewRoom', createNewRoom);
    socket.on('joinToRoom', webUserJoinToRoom);
    socket.on('getRoomInfor', getRoomInfor);
    socket.on('sendFileChunk', saveFileChunkFromWeb);
    socket.on('downloadFileByChunks', sendFileByChunksToWeb);
    socket.on('openAccessToTransferByP2P', openAccessToTransferByP2P);

    socket.on('offerToUser', offerToUser);
    socket.on('answerToUser', answerToUser);
    socket.on('iceCandidateToUser', iceCandidateToUser);

    function iceCandidateToUser(params) {
        const user = rooms[params.roomId].users.find(user => user.userName === params.to);
        if (user) {
            io.to(user.socketId).emit('emitIceCandidateToUser', { error: false, candidate: params.candidate });
        } else {
            //TODO
        }
    }

    function answerToUser(params) {
        const user = rooms[params.roomId].users.find(user => user.userName === params.to);
        if (user) {
            io.to(user.socketId).emit('emitAnswerToUser', { error: false, answer: params.answer, fileInfo: params.fileInfo });
        } else {
            //TODO
        }
    }

    function offerToUser(params) {
        const user = rooms[params.roomId].users.find(user => user.userName === params.to);
        if (user) {
            io.to(user.socketId).emit('emitOfferToUser', { error: false, offer: params.offer, fromUserName: params.from });
        } else {
            //TODO
        }
    }

    function openAccessToTransferByP2P(fileInfo) {
        const roomId = fileInfo.roomId;
        const fileName = fileInfo.name;
        const shearedFile = { socketId: socket.id, fileName: fileName, fromUser: fileInfo.fromUser };
        const room = rooms[roomId];
        if (room.shearedFiles == null) {
            room.shearedFiles = [];
        }
        room.shearedFiles.push(shearedFile);
        const users = room.users;
        if (users) {
            users.forEach(user => {
                io.to(user.socketId).emit('emitNewOpenAccessToTransferByP2P', { error: false, fileInformation: shearedFile });
            });
        }
    }

    async function sendFileByChunksToWeb(data) {
        const roomId = data.roomId;
        const fileName = data.name;
        const chunkIndex = data.chunkIndex;
        const writeStreamFile = getWriteStreamFileBySocketId(socket.id);
        if (writeStreamFile) {
            if (writeStreamFile.isServerLoad) {
                console.error("Error");
                //TODO
            }
            const chunk = writeStreamFile.chunks[chunkIndex];
            if (writeStreamFile.offset != writeStreamFile.fileTransferInformation.fileSize) {
                socket.emit('emitDownloadFileByChunks', { error: false, finish: false, chunk: chunk, file: writeStreamFile.fileTransferInformation.getObject() });
                const fileTransferInformation = writeStreamFile.fileTransferInformation;
                writeStreamFile.offset += chunk.byteLength;
                writeStreamFile.fileTransferInformation.progress = (writeStreamFile.offset / fileTransferInformation.fileSize) * 100;
            } else {
                socket.emit('emitDownloadFileByChunks', { error: false, finish: true, file: writeStreamFile.fileTransferInformation.getObject() }); // Signal the end of file transmission
                deleteWriteStreamFile(writeStreamFile, false);
            }
        } else {
            const pathFile = './uploadsFiles/' + roomId + '/' + fileName;
            const chunkSize = 526 * 1024;
            const stats = await fs.promises.stat(pathFile);
            const fileInfo = {
                name: fileName,
                size: stats.size,
                roomId: roomId,
                fromUser: 'Server',
                toUser: data.toUser
            };
            const readStream = fs.createReadStream(pathFile, { highWaterMark: chunkSize });
            const chunks = [];
            readStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            readStream.on('end', () => {
                const writeStreamFile = { socketId: socket.id, isServerLoad: false, chunks: chunks, chunkIndex: chunkIndex, fileStream: null, offset: chunks[chunkIndex].byteLength, roomId: fileInfo.roomId, fileTransferInformation: new FileTransferInformation(fileInfo.fromUser, fileInfo.toUser, fileInfo.name, false, fileInfo.size) };
                streamFiles.push(writeStreamFile);
                socket.emit('emitDownloadFileByChunks', { error: false, finish: false, chunk: chunks[chunkIndex], file: fileInfo });
            });
        }
    }

    function saveFileChunkFromWeb(fileInfo, chunk) {
        const path = './uploadsFiles/' + fileInfo.roomId;
        let writeStreamFile = getWriteStreamFileBySocketId(socket.id);
        if (writeStreamFile) {
            writeStreamFile.fileStream.write(Buffer.from(chunk), () => {
                writeStreamFile.offset += chunk.length;
                writeStreamFile.chunkIndex = fileInfo.chunkIndex;
                writeStreamFile.fileTransferInformation.progress = (writeStreamFile.offset / fileInfo.size) * 100;
                console.log((writeStreamFile.offset / fileInfo.size) * 100 + '% Write operation completed successfully.');
                io.to(socket.id).emit('emitSendFileChunk', { error: false, });
                if ((writeStreamFile.offset / fileInfo.size) == 1) {
                    sendInforNewFileUpload(fileInfo);
                    deleteWriteStreamFile(writeStreamFile, false);
                }
            });
        } else {
            fs.mkdir(path, function (err) {
                if (err && err.code !== 'EEXIST') {
                    console.error(`Creating file: ${err}`);
                    return;
                }
                const fileStream = fs.createWriteStream(path + '/' + fileInfo.name);
                writeStreamFile = { socketId: socket.id, isServerLoad: true, chunks: [], chunkIndex: fileInfo.chunkIndex, fileStream: fileStream, offset: chunk.length, roomId: fileInfo.roomId, fileTransferInformation: new FileTransferInformation(fileInfo.fromUser, fileInfo.toUser, fileInfo.name, false, 0) };
                streamFiles.push(writeStreamFile);
                fileStream.write(Buffer.from(chunk), () => {
                    io.to(socket.id).emit('emitSendFileChunk', { error: false, });
                    if ((writeStreamFile.offset / fileInfo.size) == 1) {
                        deleteWriteStreamFile(writeStreamFile, false);
                    }
                });
            });
        }
    }

    async function deleteWriteStreamFile(writeStreamFileDelete, lostConnect) {
        const index = streamFiles.findIndex(writeStreamFile => writeStreamFile.fileTransferInformation.unicId == writeStreamFileDelete.fileTransferInformation.unicId);
        const room = rooms[writeStreamFileDelete.roomId];
        if (index !== -1) {
            if (writeStreamFileDelete.isServerLoad) {
                writeStreamFileDelete.fileStream.end();
                if (lostConnect) {
                    await fs.promises.unlink(writeStreamFileDelete.fileStream.path);
                }
            }
            streamFiles.splice(index, 1);
            if (room || room.users) {
                room.users.forEach(user => {
                    io.to(user.socketId).emit('emitFileTransferInformationsInRoomsFinish', { error: false, fileTransferInformationsInRooms: [writeStreamFileDelete.fileTransferInformation.getObject()] });
                });
            }
        }
    }

    function getWriteStreamFileBySocketId(socketId) {
        for (const writeStreamFile of streamFiles) {
            if (writeStreamFile.socketId === socketId) {
                return writeStreamFile;
            }
        }
        return null;
    }

    function sendInforNewFileUpload(fileInfo) {
        const room = rooms[fileInfo.roomId];
        if (room) {
            room.users.forEach(function (userInfor, index) {
                io.to(userInfor.socketId).emit('emitNewFileUploading', { error: false, filesInDataBase: [fileInfo.name] });
            });
        } else {
            //TODO
        }
    }

    async function getRoomInfor() {
        const roomInfor = findRoomInforByUserSockedId(socket.id);
        if (roomInfor) {
            const room = roomInfor.room;
            const roomId = roomInfor.roomName;
            const directoryName = './uploadsFiles/' + roomId;
            const users = room.users;
            const shearedFiles = room.shearedFiles;
            const filesInDataBase = await fs.promises.readdir(directoryName);

            const sendDataUsersName = users;
            const sendDataShearedFiles = shearedFiles;
            const sendDataFilesInDataBase = filesInDataBase;
            socket.emit('emitGetRoomInfor', { error: false, yourSocketId: socket.id, users: sendDataUsersName, shearedFiles: sendDataShearedFiles, filesInDataBase: sendDataFilesInDataBase });
        } else {
            //TODO
        }
    }

    function findRoomInforByUserSockedId(socketId) {
        for (const room in rooms) {
            for (const user of rooms[room].users) {
                if (user.socketId == socketId) {
                    return { room: rooms[room], roomName: room };
                }
            }
        }
        return null;
    }

    function webUserJoinToRoom(roomId) {
        const room = rooms[roomId];
        if (room) {
            const socketId = socket.id;
            const webUser = returnWebUserBySocked(socket);
            if (webUser) {
                const users = rooms[roomId].users;
                if (users) {
                    rooms[roomId].users.push({ socketId: socketId, userName: webUser.name });
                    users.forEach(function (user, index) {
                        io.to(user.socketId).emit('emitNewUserJoin', { error: false, users: [{ userName: webUser.name, socketId: socketId }] });
                    });
                } else {
                    rooms[roomId].users = [{ socketId: socketId, userName: webUser.name }];
                }
                socket.emit("emitJoinToRoom", { error: false });
            } else {
                //TODO
            }
        }
    }

    function getListRooms() {
        socket.emit("emitGetListRooms", Object.keys(rooms));
    }

    function createNewRoom(data) {
        if (rooms[data] != null) {
            socket.emit("emitCreateNewRoom", { error: true, message: "Кімната вже існує" });
        } else {
            rooms[data] = new Room();
            socket.emit("emitCreateNewRoom", { error: false });
        }
    }

    function webUserDisconnect() {
        removeWebUser(socket);
        removeSocketIdFromRooms(socket.id);
        removeStreamFilesBySockedId(socket.id);
    }

    function removeStreamFilesBySockedId(socketId) {
        const indexes = [];
        streamFiles.forEach((streamFile, index) => {
            if (streamFile.socketId == socketId) {
                indexes.push(index);
                if (streamFile.fileStream) {
                    streamFile.fileStream.end();
                }
                streamFile.chunk = [];
                streamFile.chunkIndex = 0;
            }
        });
        indexes.sort((a, b) => b - a);
        indexes.forEach(async (index) => {
            if (index !== -1) {
                await deleteWriteStreamFile(streamFiles[index], true);
                //streamFiles.splice(index, 1);
            }
        });
    }

    function removeSocketIdFromRooms(socketId) {
        for (const value in rooms) {
            if (rooms[value].users) {
                const index = rooms[value].users.findIndex(user => user.socketId === socketId);
                if (index !== -1) {
                    rooms[value].users.splice(index, 1);
                    sendInforAboutUserDisconnect(rooms[value], socketId)
                }
            }
            if (rooms[value].shearedFiles) {
                const index = rooms[value].shearedFiles.findIndex(shearedFile => shearedFile.socketId === socketId);
                if (index !== -1) {
                    const shearedFile = rooms[value].shearedFiles[index];
                    rooms[value].shearedFiles.splice(index, 1);
                    if (rooms[value] && rooms[value].users) {
                        sendInforAboutShearedFileDisconnect(rooms[value], shearedFile)
                    }

                }
            }
        }
    }

    function sendInforAboutShearedFileDisconnect(room, shearedFile) {
        for (const user of room.users) {
            io.to(user.socketId).emit('emitRemoveP2PFileInfor', { error: false, fileInfo: shearedFile });
        }
    }

    function sendInforAboutUserDisconnect(room, socketId) {
        for (const user of room.users) {
            io.to(user.socketId).emit('emitUserLeaveRoom', { error: false, socketId: socketId });
        }
    }

    function removeWebUser(socket) {
        const webUsers = socketUsers[socket.idIdentifier];
        if (webUsers) {
            const index = webUsers.findIndex(obj => obj.socketId === socket.id);
            if (index !== -1) {
                socketUsers[socket.idIdentifier].splice(index, 1);
                if (socketUsers[socket.idIdentifier].length == 0) {
                    delete socketUsers[socket.idIdentifier];
                }
            }
        }
    }

    function loginningInWeb(userInfor) {
        let userName = userInfor.userName;
        let webUser = null;
        let userId = userInfor.idIdentifier;
        if (userId == null || userId == '') {
            //TODO
        }
        const ipAdress = socket.handshake.address;
        webUser = returnWebUserBySocked(socket);
        if (webUser == null) {
            if (userName == null || userName == '') {
                userName = generateUsername();
            }
            if (socketUsers[userId] == null) {
                socketUsers[userId] = [];
            }

            webUser = new WebUserInformation(userName, socket.id, ipAdress);
            socketUsers[userId].push(webUser);
        }
        socket.emit("emitLoginning", { error: false, isConnected: true, userName: webUser.name });
    }

    function returnWebUserBySocked(socket) {
        const users = socketUsers[socket.idIdentifier] || [];
        for (const element of users) {
            if (element.socketId == socket.id) {
                return element;
            }
        }
        return null;
    }

    function generateUsername() {
        const prefix = 'user_';
        const randomNumber = Math.floor(Math.random() * 1000000); // generate a random integer between 0 and 999999
        return prefix + randomNumber;
    }

});

function getRooms() {
    return rooms;
}

module.exports = {
    io: io,
    getRooms: getRooms
}