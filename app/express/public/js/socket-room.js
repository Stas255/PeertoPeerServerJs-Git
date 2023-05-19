function setupEmitUserInformation(socket, userList) {
    socket.on("emitNewUserJoin", (data) => {
        if (!data.error) {
            if (data.users) {
                for (let i = 0; i < data.users.length; i++) {
                    userList.innerHTML += '<li class="list-group-item" id="userName_' + data.users[i].socketId + '">' + data.users[i].userName + '</li>';
                }
            }
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });

    socket.on("emitUserLeaveRoom", (data) => {
        if (!data.error) {
            const element = document.getElementById('userName_' + data.socketId);
            element.remove();
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });
}

function setupEmitJoinToRoom(socket, userList, fileList) {
    socket.on("emitJoinToRoom", (data) => {
        if (!data.error) {
            userList.innerHTML = '';
            fileList.innerHTML = '';
            socket.emit("getRoomInfor");
            socket.on("emitGetRoomInfor", (data) => {
                if (!data.error) {
                    if (data.users) {
                        for (let i = 0; i < data.users.length; i++) {
                            userList.innerHTML += '<li class="list-group-item" id="userName_' + data.users[i].socketId + '">' + data.users[i].userName + (data.yourSocketId == data.users[i].socketId ? '-You' : '') + '</li>';
                        }
                    }
                    if (data.shearedFiles) {
                        for (let i = 0; i < data.shearedFiles.length; i++) {
                            fileList.innerHTML += createP2PFileInforRow(data.shearedFiles[i].fileName, data.shearedFiles[i].fromUser);
                        }
                    }

                    if (data.filesInDataBase) {
                        for (let i = 0; i < data.filesInDataBase.length; i++) {
                            fileList.innerHTML += createSeverFileInforRow(data.filesInDataBase[i]);
                        }
                    }

                } else {
                    nameError.style.display = 'block'
                    nameError.classList = "text-danger"
                    nameError.innerHTML = data.message
                }
                console.log(data);
            });
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    })
}

function setupEmitNewFileUploading(socket, fileList) {
    socket.on("emitNewFileUploading", (data) => {
        if (!data.error) {
            if (data.filesInDataBase) {
                for (let i = 0; i < data.filesInDataBase.length; i++) {
                    fileList.innerHTML += createSeverFileInforRow(data.filesInDataBase[i]);
                }
            }
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });
}

function setupEmitRemoveServerFileInfor(socket) {
    socket.on("emitRemoveServerFileInfor", (data) => {
        if (!data.error) {
            const fileInfo = data.fileInfo;
            const liFileInfo = document.getElementById('server_' + fileInfo.fileName);
            if (liFileInfo) {
                liFileInfo.remove();
            }
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });
}

function setupEmitRemoveP2PFileInfor(socket) {
    socket.on("emitRemoveP2PFileInfor", (data) => {
        if (!data.error) {
            const fileInfo = data.fileInfo;
            const liFileInfo = document.getElementById('p2p_' + fileInfo.fromUser + '+_' + fileInfo.fileName);
            if (liFileInfo) {
                liFileInfo.remove();
            }
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });
}

function setupEmitFileTransferInformationsInRoom(socket, progressBarsInformations) {
    socket.on("emitFileTransferInformationsInRooms", (data) => {
        if (!data.error) {
            const fileTransferInformationsInRooms = data.fileTransferInformationsInRooms;
            for (let i = 0; i < data.fileTransferInformationsInRooms.length; i++) {
                const fileTransferInformation = data.fileTransferInformationsInRooms[i];
                const progressBarsInformation = progressBarsInformations[fileTransferInformation.unicId];
                if (progressBarsInformation) {
                    setNewdataInProgressBar(progressBarsInformation, fileTransferInformation.progress)
                } else {
                    const newProgressBarsInformation = createProgressBar(fileTransferInformation, 'alert-primary');
                    progressBarsInformations[fileTransferInformation.unicId] = newProgressBarsInformation;
                }
            }
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });
}

function setupEmitNewOpenAccessToTransferByP2P(socket, fileList) {
    socket.on("emitNewOpenAccessToTransferByP2P", (data) => {
        if (!data.error) {
            const fileInformation = data.fileInformation;
            fileList.innerHTML += createP2PFileInforRow(fileInformation.fileName, fileInformation.fromUser);
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });
}

function setupEmitFileTransferInformationsInRoomsFinish(socket, progressBarsInformations) {
    socket.on("emitFileTransferInformationsInRoomsFinish", (data) => {
        if (!data.error) {
            const fileTransferInformationsInRooms = data.fileTransferInformationsInRooms;
            for (let i = 0; i < data.fileTransferInformationsInRooms.length; i++) {
                const fileTransferInformation = data.fileTransferInformationsInRooms[i];
                const progressBarsInformation = progressBarsInformations[fileTransferInformation.unicId];
                if (progressBarsInformation) {
                    progressBarsInformation.alertDiv.remove();
                }
            }
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });
}

function setNewdataInProgressBar(progressBar, progress) {
    progressBar.progressBar.style.width = progress + '%';
}

function createProgressBar(fileTransferInformation, alertinfor) {
    var alertDiv = document.createElement('div');
    alertDiv.className = 'alert ' + alertinfor;
    alertDiv.id = 'fileTransferInformation_' + fileTransferInformation.unicId;

    var progressBarDiv = document.createElement('div');
    progressBarDiv.className = 'progress';

    var progressBar = document.createElement('div');
    progressBar.className = 'progress-bar progress-bar-striped progress-bar-animated';
    progressBar.style.width = fileTransferInformation.progress + '%';
    progressBar.setAttribute('role', 'progressbar');
    progressBarDiv.appendChild(progressBar);

    alertDiv.innerHTML = '<strong>' + fileTransferInformation.fromUser + '</strong> is transferring <strong>' + fileTransferInformation.fileName + '</strong> to <strong>' + fileTransferInformation.toUser + '</strong>.';
    alertDiv.appendChild(progressBarDiv);

    document.getElementById('transferInfo').appendChild(alertDiv);
    return { progressBar: progressBar, alertDiv: alertDiv }
}

function createSeverFileInforRow(fileName) {
    /*return '<li class="list-group-item" id="' + fileName + '">' + fileName
        + '<button type="button" class="btn btn-primary float-right">Download</button>'
        + '</li>';*/
    return '<li class="list-group-item"  id="server_' + fileName + '">'
        + '<div class="row">'
        + '<div class="col-sm-7">'
        + '<span id="' + fileName + '" class="mr-3 truncate">' + fileName + '</span>'
        + '</div>'
        + '<div class="col-sm-2 text-right">'
        + (isFbx(fileName) ? '<button type="button" class="btn btn-success" onclick="location.href=\''+setView(fileName)+'\';" >View</button>' : ' ')
        + '</div>'
        + '<div class="col-sm-3 text-right">'
        + '<button type="button" class="btn btn-primary" onclick="downloadFileFromServer(\'' + fileName + '\')">Download</button>'
        + '</div>'
        + ' </div>'
    + '</li>';
}

function isFbx(fileName) {
    var fileExtension = fileName.split('.').pop().toLowerCase();
    return fileExtension === 'fbx' || fileExtension === 'FBX';
}

function setView(fileName) {
    var currentUrl = window.location.pathname;
    return currentUrl + "/view/"+fileName;
}

function createP2PFileInforRow(fileName, userName) {
    /*return '<li class="list-group-item" id="' + fileName + '">' + fileName
        + '<button type="button" class="btn btn-primary float-right">Download</button>'
        + '</li>';*/
    return '<li class="list-group-item" id="p2p_' + userName + '+_' + fileName + '">'
        + '<div class="row">'
        + '<div class="col-sm-4">'
        + '<span id="' + fileName + '" class="mr-3 truncate">' + fileName + '</span>'
        + '</div>'
        + '<span class="col-sm-4" id="informationUserForFile_' + fileName + '">'
        + userName
        + '</span>'
        + '<div class="col-sm-4 text-right">'
        + '<button type="button" class="btn btn-primary" onclick="downloadFileFromUser(\'' + fileName + '\' , \'' + userName + '\', \'' + roomId + '\')">Download fron user</button>'
        + '</div>'
        + ' </div>'
        + '</li>';
}