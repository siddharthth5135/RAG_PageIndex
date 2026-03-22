export class Logger {
  constructor(terminalElementId) {
    this.terminal = document.getElementById(terminalElementId);
  }

  log(message, isSuccess = false) {
    const d = new Date();
    const time = [
      d.getHours().toString().padStart(2, '0'),
      d.getMinutes().toString().padStart(2, '0'),
      d.getSeconds().toString().padStart(2, '0')
    ].join(':') + '.' + d.getMilliseconds().toString().padStart(3, '0');
    
    const div = document.createElement('div');
    div.className = 'log-entry';
    
    const timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = `[${time}]`;
    
    const msgSpan = document.createElement('span');
    msgSpan.className = isSuccess ? 'log-success' : 'log-action';
    msgSpan.textContent = message;
    
    div.appendChild(timeSpan);
    div.appendChild(msgSpan);
    
    this.terminal.appendChild(div);
    this.terminal.scrollTop = this.terminal.scrollHeight;
  }

  clear() {
    this.terminal.innerHTML = '';
  }
}
