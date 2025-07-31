# Yahoo Messenger Clone 🎯

A nostalgic real-time chat application inspired by classic Yahoo Messenger, built with modern web technologies.

## ✨ Features

### 🎯 Core Features
- **User Authentication** - Register, Login, Logout with JWT
- **Real-time Chat** - Instant messaging with Socket.IO
- **Room System** - Join multiple chat rooms simultaneously
- **Private Messaging** - 1-to-1 direct messages
- **Buddy List** - Friends system with online/offline status
- **Typing Indicators** - See when someone is typing
- **Emoji Support** - Express yourself with emojis
- **Message Sounds** - Classic notification sounds

### 📚 Room Categories
- **Main Lobby Rooms** - India, Global
- **Indian State Rooms** - Dedicated rooms for each Indian state
- **Language Rooms** - Chat in your preferred language (Hindi, Tamil, etc.)
- **Custom Rooms** - Create or join custom chat rooms

### 👥 User Features
- **Status System** - Online, Away, Busy, Invisible
- **Avatar Support** - Upload and display profile pictures
- **User Profiles** - Detailed user information
- **Friend Requests** - Add/remove friends
- **Last Seen** - Track when users were last online

### 🎨 Classic Yahoo Design
- **Nostalgic UI** - Purple, blue, and yellow color scheme
- **Retro Fonts** - Trebuchet MS and classic web fonts
- **Chat Bubbles** - Classic message bubble design
- **Gradient Headers** - Yahoo-style gradients
- **Status Indicators** - Colored dots for user status

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Beautiful component library
- **Socket.IO Client** - Real-time communication
- **React Hot Toast** - Elegant notifications
- **Emoji Picker React** - Emoji selection
- **Axios** - HTTP client
- **Date-fns** - Date formatting

### Backend (Setup Required)
- **Node.js + Express** - Server framework
- **MongoDB + Mongoose** - Database
- **Socket.IO** - Real-time engine
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin requests

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or Atlas)

### Frontend Setup
1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd yahoo-messenger
   npm install
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env with your backend URLs
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

### Backend Setup (Separate Repository Required)
Create a separate backend project with this structure:

```
backend/
├── server.js
├── .env
├── models/
│   ├── User.js
│   ├── Message.js
│   └── Room.js
├── routes/
│   ├── auth.js
│   ├── rooms.js
│   └── messages.js
├── middleware/
│   └── auth.js
└── socket/
    └── socketHandlers.js
```

#### Backend Dependencies
```bash
npm init -y
npm install express mongoose socket.io cors dotenv bcryptjs jsonwebtoken
npm install -D nodemon
```

#### Environment Variables (.env)
```bash
PORT=5000
MONGODB_URI=mongodb://localhost:27017/yahoo-messenger
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── Chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   └── TypingIndicator.tsx
│   ├── Header/
│   │   └── YahooHeader.tsx
│   ├── Layout/
│   │   └── MainLayout.tsx
│   ├── Sidebar/
│   │   ├── RoomList.tsx
│   │   └── BuddyList.tsx
│   └── ui/ (Shadcn components)
├── contexts/
│   ├── AuthContext.tsx
│   └── SocketContext.tsx
├── pages/
│   ├── Index.tsx
│   ├── Auth.tsx
│   └── NotFound.tsx
├── assets/
│   └── yahoo-logo.png
└── lib/
    └── utils.ts
```

## 🎨 Design System

### Colors
- **Yahoo Purple**: Primary brand color
- **Yahoo Blue**: Secondary accent
- **Yahoo Yellow**: Highlights and notifications
- **Status Colors**: Green (online), Yellow (away), Red (busy), Gray (offline)

### Typography
- **Primary**: Trebuchet MS
- **Secondary**: Verdana
- **Fallback**: Sans-serif system fonts

### Components
- **Chat Bubbles**: Rounded corners with shadows
- **Status Indicators**: Colored dots with borders
- **Gradients**: Yahoo-style multi-color gradients
- **Scrollbars**: Custom Yahoo-themed scrollbars

## 🌐 Room System

### Predefined Rooms
The app automatically creates rooms for:

**Indian States**: Andhra Pradesh, Assam, Bihar, Chhattisgarh, Goa, Gujarat, Haryana, Himachal Pradesh, Jharkhand, Karnataka, Kerala, Madhya Pradesh, Maharashtra, Manipur, Meghalaya, Mizoram, Nagaland, Odisha, Punjab, Rajasthan, Sikkim, Tamil Nadu, Telangana, Tripura, Uttar Pradesh, Uttarakhand, West Bengal

**Languages**: Hindi, English, Marathi, Tamil, Telugu, Kannada, Malayalam, Punjabi, Bengali, Gujarati, Assamese, Odia

### Room Features
- **Real-time participant count**
- **Join/leave notifications**
- **Message history**
- **Typing indicators**
- **Room categories and organization**

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/status` - Update user status
- `PATCH /api/auth/avatar` - Update user avatar

### Rooms
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id/messages` - Get room messages
- `POST /api/rooms/:id/join` - Join room
- `POST /api/rooms/:id/leave` - Leave room

### Messages
- `GET /api/messages/private/:userId` - Get private messages
- `POST /api/messages/private` - Send private message
- `PATCH /api/messages/:id/read` - Mark message as read

## 🎵 Socket Events

### Connection
- `connect` - User connected
- `disconnect` - User disconnected
- `user_online` - User came online
- `user_offline` - User went offline

### Messaging
- `send_message` - Send a message
- `new_message` - Receive new message
- `start_typing` - User started typing
- `stop_typing` - User stopped typing
- `user_typing` - Someone is typing
- `user_stopped_typing` - Someone stopped typing

### Rooms
- `join_room` - Join a room
- `leave_room` - Leave a room
- `room_joined` - Successfully joined room
- `room_left` - Successfully left room
- `user_joined_room` - Someone joined room
- `user_left_room` - Someone left room

## 🚀 Deployment

### Frontend (Vercel/Netlify)
1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Environment variables**
   - Set `VITE_API_URL` to your backend URL
   - Set `VITE_SOCKET_URL` to your backend URL

### Backend (Render/Railway)
1. **Prepare for deployment**
   ```bash
   # Add start script to package.json
   "scripts": {
     "start": "node server.js",
     "dev": "nodemon server.js"
   }
   ```

2. **Environment variables**
   - `MONGODB_URI` - MongoDB connection string
   - `JWT_SECRET` - JWT signing secret
   - `PORT` - Server port (auto-assigned by platform)
   - `NODE_ENV` - Set to "production"

## 🎯 Features Roadmap

### Implemented ✅
- User authentication with JWT
- Real-time chat with Socket.IO
- Room system with categories
- Buddy list with status indicators
- Typing indicators
- Message history
- Emoji picker
- Responsive design
- Yahoo-inspired UI/UX

### Coming Soon 🚧
- File sharing and image uploads
- Voice messages
- Message encryption
- Push notifications
- Mobile app (React Native)
- Video/audio calling
- Message search
- Chat history export
- Admin panel
- Moderation tools

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open Pull Request**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Yahoo Messenger** - Original inspiration
- **Shadcn/ui** - Beautiful component library
- **Socket.IO** - Real-time communication
- **Tailwind CSS** - Utility-first styling
- **React Team** - Amazing framework

## 📞 Support

If you encounter any issues or have questions:

1. **Check the documentation** above
2. **Search existing issues** on GitHub
3. **Create a new issue** with detailed information
4. **Join our Discord** for community support

---

**Built with ❤️ and nostalgia for the golden age of instant messaging**