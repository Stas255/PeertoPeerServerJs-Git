function connectToUserAndDownloadFile(socket, toUserName, roomId, fileName) {
    let pc_constraints = { "optional": [{ "DtlsSrtpKeyAgreement": true }] };
    let pc_config = {
        iceServers: [
            {
                urls: 'turn:relay1.expressturn.com:3478',
                username: 'efTL13SHG2VNFCIEIX',
                credential: '8n1GZ7ljeyZIgSNg'
            },
            {
                urls: 'stun:stun.l.google.com:19302'
            }
        ]
    };
    const peerConnection = new RTCPeerConnection(pc_config, pc_constraints);

    peerConnection.onnegotiationneeded = async () => {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        socket.emit('offerToUser', {
            offer: offer,
            from: sessionStorage.getItem('userName'),
            to: toUserName,
            roomId: roomId,
            fileName: fileName
        });
    };

    let receivedChunks = [];
    let dataChannel = peerConnection.createDataChannel('fileTransfer');
    let fileInfo = null;
    let size = 0;
    let progressBarsInformations = [];
    dataChannel.onmessage = (event) => {
        const message = event.data;
        if (message == "getMaximumMessageSize") {
            dataChannel.send(JSON.stringify({ getMaximumMessageSize: peerConnection.sctp.maxMessageSize }));
            return;
        }
        if (message === 'EOF') {
            const fileBlob = new Blob(receivedChunks);
            const fileURL = URL.createObjectURL(fileBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = fileURL;
            downloadLink.download = fileName;
            downloadLink.click();
            URL.revokeObjectURL(fileURL);
            const progressBarsInformation = progressBarsInformations[fileInfo.toUser + fileInfo.name];
            if (progressBarsInformation) {
                progressBarsInformation.alertDiv.remove();
            }
        } else {
            // Concatenate the received chunk to the binary string
            const progressBarsInformation = progressBarsInformations[fileInfo.toUser + fileInfo.name];
            size += message.byteLength;
            if (progressBarsInformation) {
                setNewdataInProgressBar(progressBarsInformation, (size / fileInfo.size) * 100)
            } else {
                const newProgressBarsInformation = createProgressBar(fileInfo, 'alert-primary');
                progressBarsInformations[fileInfo.toUser + fileInfo.name] = newProgressBarsInformation;
            }
            receivedChunks.push(message);
            event.target.send("ok");
        }
    };
    socket.on('emitAnswerToUser', async (data) => {
        if (!data.error) {
            const remoteDesc = new RTCSessionDescription(data.answer);
            await peerConnection.setRemoteDescription(remoteDesc);
            fileInfo = data.fileInfo;
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });

    socket.on('emitIceCandidateToUser', (data) => {
        if (!data.error) {
            peerConnection.addIceCandidate(data.candidate);
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });

    peerConnection.onicecandidate = ({ candidate }) => {
        if (event.candidate) {
            console.log('ICE Candidate:', event.candidate);
        } else {
            console.log('ICE Candidate gathering complete.');
        }
        if (candidate) {
            socket.emit('iceCandidateToUser', {
                candidate: candidate,
                roomId: roomId,
                from: sessionStorage.getItem('userName'),
                to: toUserName
            });
        }
    };
    // Log signaling state changes
    peerConnection.onsignalingstatechange = () => {
        console.log('Signaling state:', peerConnection.signalingState);
        /*createDataChannel(dataChannel, receivedChunks, fileName);
        dataChannel.maxRetransmitSize = 5 * 1024 * 1024;
        dataChannel.onopen = () => {
            let maximumMessageSize = peerConnection.sctp.maxMessageSize;
            console.log(maximumMessageSize);
        };*/
    };

    // Log connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
    };

    // Log track events
    peerConnection.ontrack = event => {
        console.log('Track:', event.track);
    };

    // Log data channel events
    peerConnection.ondatachannel = event => {
        console.log('Data channel:', event.channel);
    };

    // Log errors
    peerConnection.onerror = error => {
        console.error('RTCPeerConnection error:', error);
    };
}

async function connectToUserAndSendFile(socket, offer, toUserName, file) {
    var pc_constraints = { "optional": [{ "DtlsSrtpKeyAgreement": true }] };
    var pc_config = {
        iceServers: [
            {
                urls: 'turn:relay1.expressturn.com:3478',
                username: 'efTL13SHG2VNFCIEIX',
                credential: '8n1GZ7ljeyZIgSNg'
            },
            {
                urls: 'stun:stun.l.google.com:19302'
            }
        ]
    };
    const peerConnection = new RTCPeerConnection(pc_config, pc_constraints);

    await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const fileInfo = {
        fileName: file.name,
        size: file.size,
        type: file.type,
        fromUser: sessionStorage.getItem('userName'),
        toUser: toUserName,
    };

    socket.emit('answerToUser', {
        answer: answer,
        roomId: roomId,
        from: sessionStorage.getItem('userName'),
        to: toUserName,
        fileInfo: fileInfo
    });

    socket.on('emitIceCandidateToUser', (data) => {
        if (!data.error) {
            peerConnection.addIceCandidate(data.candidate);
        } else {
            nameError.style.display = 'block'
            nameError.classList = "text-danger"
            nameError.innerHTML = data.message
        }
    });

    var fileBinaryString = null;
    let i = 0;
    let startSending = false;
    let progressBarsInformations = [];

    peerConnection.ondatachannel = ({ channel }) => {
        console.log('Data channel:', channel);
        channel.onmessage = async (event) => {
            let data = event.data;
            if (isStringObject(data) && JSON.parse(data).getMaximumMessageSize && !startSending) {
                fileBinaryString = await readFileAsync(file, JSON.parse(data).getMaximumMessageSize);
                startSending = true;
            }
            if (startSending) {
                if (i < fileBinaryString.length) {
                    channel.send(fileBinaryString[i]);
                    i++;
                    const progressBarsInformation = progressBarsInformations[fileInfo.toUser + fileInfo.name];
                    if (progressBarsInformation) {
                        this.setNewdataInProgressBar(progressBarsInformation, (i / fileBinaryString.length) * 100)
                    } else {
                        const newProgressBarsInformation = this.createProgressBar(fileInfo, 'alert-primary');
                        progressBarsInformations[fileInfo.toUser + fileInfo.name] = newProgressBarsInformation;
                    }
                } else {
                    channel.send('EOF');
                    const progressBarsInformation = progressBarsInformations[fileInfo.toUser + fileInfo.name];
                    if (progressBarsInformation) {
                        progressBarsInformation.alertDiv.remove();
                    }
                }
            }
        };
        channel.onopen = async () => {
            channel.send("getMaximumMessageSize");
            /*fileBinaryString = await readFileAsync(file);
            channel.onbufferedamountlow = () => {
                console.log('Send queue is no longer full. You can resume sending data.');
            };
            if (i < fileBinaryString.length) {
                channel.send(fileBinaryString[i]);
                i++;
            } else {
                channel.send('EOF');
            }*/
        };
    };

    function isStringObject(str) {
        try {
            const parsedObj = JSON.parse(str);
            return typeof parsedObj === 'object';
        } catch (error) {
            return false;
        }
    }

    // Log ICE candidate events
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            console.log('ICE Candidate:', event.candidate);
        } else {
            console.log('ICE Candidate gathering complete.');
        }
        if (event.candidate) {
            socket.emit('iceCandidateToUser', {
                candidate: event.candidate,
                roomId: roomId,
                from: sessionStorage.getItem('userName'),
                to: toUserName
            });
        }
    };

    // Log negotiation needed event
    peerConnection.onnegotiationneeded = () => {
        console.log('Negotiation needed.');
    };

    // Log signaling state changes
    peerConnection.onsignalingstatechange = () => {
        console.log('Signaling state:', peerConnection.signalingState);
    };

    // Log connection state changes
    peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
    };

    // Log track events
    peerConnection.ontrack = event => {
        console.log('Track:', event.track);
    };

    // Log errors
    peerConnection.onerror = error => {
        console.error('RTCPeerConnection error:', error);
    };
}

function canSendData(dataChannel) {
    return dataChannel.readyState === 'open' && dataChannel.bufferedAmount === 0;
}

function readFileAsync(file, CHUNK_SIZE) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(splitArrayBuffer(reader.result, CHUNK_SIZE));
        };

        reader.onerror = () => {
            reject(reader.error);
        };

        reader.readAsArrayBuffer(file);
    });
}

function splitArrayBuffer(arrayBuffer, chunkSize) {
    const chunks = [];
    const totalLength = arrayBuffer.byteLength;
    let offset = 0;

    while (offset < totalLength) {
        const remaining = totalLength - offset;
        const currentChunkSize = Math.min(chunkSize, remaining);
        const chunk = arrayBuffer.slice(offset, offset + currentChunkSize);
        chunks.push(chunk);
        offset += currentChunkSize;
    }

    return chunks;
}
