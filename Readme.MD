### Folder Structure

```
audio-call-system/
├── client/                    # ReactJS frontend
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── components/
│   │   │   └── CallInterface.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.js
│   │   └── webrtc.js
│   ├── Dockerfile 
│   ├── package.json
│   └── tailwind.config.js
├── server/                    # Go backend
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile    
├── docker-compose.yml       # For testing with containers
└── README.md
```
#   a u d i o c a l l  
 