function connectToServer(nameError, userNameInput) {
  return new Promise((resolve, reject) => {
    var socket = io();

    let idIdentifier = localStorage.getItem('idIdentifier');
    if (idIdentifier == null) {
      idIdentifier = generateRandomUnicodeString(35)
      localStorage.setItem('idIdentifier', idIdentifier);
    }
    const originalEmit = io.Socket.prototype.emit;
    io.Socket.prototype.emit = function (eventName, ...args) {
      // Modify args array or add additional parameters here
      args= {'data': args, 'idIdentifier':idIdentifier};

      // Call the original emit function with modified arguments
      return originalEmit.apply(this, [eventName, args]);
    };
    socket.on('connect', () => {
      document.getElementById('serverInformation').textContent = 'Встановлено звязок з сервером';
      nameError.classList = "text-info"
      nameError.innerHTML = 'Вхід до сервера'
      socket.emit("loginning", { userName: sessionStorage.getItem('userName'), idIdentifier: idIdentifier });
    });
    socket.on('reconnect', () => {
      console.log('Socket reconnected');
      window.location.reload();
    });
    socket.on('disconnect', () => {
      document.getElementById('serverInformation').textContent = 'Втрачено звязок з сервером';
      if (confirm('Втрачено звязон з сервером зробити перезагрузку?')) {
        window.location.reload();
      } else {
        window.location.href = '/';
      }
    });
    socket.on('emitLoginning', (data) => {
      userNameInput.value = data.userName;
      sessionStorage.setItem('userName', data.userName);
      nameError.innerHTML = 'Вхід як користувач завершено'
      console.log(data);
      resolve(socket);
    });
    socket.on("emitChangeName", (data) => {
      if (!data.error) {
        userNameInput.value = data.userName;
        sessionStorage.setItem('userName', data.userName);
        nameError.innerHTML = 'Імя змінено'; W
        nameError.classList = "text-success"
      } else {
        nameError.style.display = 'block'
        nameError.classList = "text-danger"
        nameError.innerHTML = data.message
      }

    });
  });
}

function generateRandomUnicodeString(length) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-</*+!@#$%^&()=\\|';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

function emitToCheckUserName(userName) {
  socket.emit('userExsist', userName);
}