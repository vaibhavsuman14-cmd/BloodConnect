import io from 'socket.io-client';

class SocketService {
  private socket: any = null;

  connect(userId: string) {
    if (!this.socket) {
      this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.socket?.emit('join', userId);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  emit(event: string, data: any) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

const socketService = new SocketService();
export default socketService;