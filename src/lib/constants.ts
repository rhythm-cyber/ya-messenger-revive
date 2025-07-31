// Indian States for room creation
export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh', 
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal'
];

// Indian Languages for room creation
export const INDIAN_LANGUAGES = [
  'Hindi',
  'English',
  'Marathi',
  'Tamil',
  'Telugu',
  'Kannada',
  'Malayalam',
  'Punjabi',
  'Bengali',
  'Gujarati',
  'Assamese',
  'Odia',
  'Urdu',
  'Sanskrit',
  'Kashmiri',
  'Sindhi'
];

// Main lobby rooms
export const MAIN_ROOMS = [
  'Main Lobby',
  'India',
  'Global'
];

// Default user avatars
export const DEFAULT_AVATARS = [
  '/avatars/avatar1.png',
  '/avatars/avatar2.png',
  '/avatars/avatar3.png',
  '/avatars/avatar4.png',
  '/avatars/avatar5.png',
  '/avatars/avatar6.png'
];

// Chat sound types
export const CHAT_SOUNDS = {
  MESSAGE: '/sounds/message.mp3',
  NOTIFICATION: '/sounds/notification.mp3',
  LOGIN: '/sounds/login.mp3',
  LOGOUT: '/sounds/logout.mp3',
  TYPING: '/sounds/typing.mp3'
};

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  EMOJI: 'emoji',
  SYSTEM: 'system',
  FILE: 'file',
  IMAGE: 'image'
} as const;

// User status types
export const USER_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  BUSY: 'busy',
  OFFLINE: 'offline'
} as const;

// Room types
export const ROOM_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private',
  STATE: 'state',
  LANGUAGE: 'language'
} as const;