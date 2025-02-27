import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  setDoc
} from 'firebase/firestore';

export interface ChatMessage {
  id?: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'file';
  timestamp: any;
  readBy: string[];
}

export interface ChatRoom {
  id?: string;
  type: 'private' | 'group' | 'event';
  participants: string[];
  lastMessage?: {
    content: string;
    timestamp: any;
  };
  name?: string;
  createdAt: any;
  updatedAt: any;
  eventId?: string;
}

export class ChatService {
  // Create or get private chat between two users
  static async createOrGetPrivateChat(user1Id: string, user2Id: string): Promise<string> {
    // Check if chat already exists
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('type', '==', 'private'),
      where('participants', 'array-contains', user1Id)
    );

    const querySnapshot = await getDocs(q);
    const existingChat = querySnapshot.docs.find(doc => {
      const data = doc.data();
      return data.participants.includes(user2Id);
    });

    if (existingChat) {
      return existingChat.id;
    }

    // Create new chat if none exists
    const chatData: Partial<ChatRoom> = {
      type: 'private',
      participants: [user1Id, user2Id],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const newChat = await addDoc(chatsRef, chatData);
    return newChat.id;
  }

  // Create group chat
  static async createGroupChat(name: string, participants: string[]): Promise<string> {
    const chatData: Partial<ChatRoom> = {
      type: 'group',
      name,
      participants,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const newChat = await addDoc(collection(db, 'chats'), chatData);
    return newChat.id;
  }

  // Send message
  static async sendMessage(chatId: string, senderId: string, content: string, type: 'text' | 'image' | 'file' = 'text'): Promise<void> {
    const messageData: Partial<ChatMessage> = {
      chatId,
      senderId,
      content,
      type,
      timestamp: serverTimestamp(),
      readBy: [senderId]
    };

    // Add message
    await addDoc(collection(db, 'messages'), messageData);

    // Update chat's last message
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: {
        content,
        timestamp: serverTimestamp()
      },
      updatedAt: serverTimestamp()
    });
  }

  // Subscribe to chat messages
  static subscribeToMessages(chatId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db, 'messages'),
      where('chatId', '==', chatId),
      orderBy('timestamp', 'asc')
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      callback(messages);
    });
  }

  // Subscribe to user's chats
  static subscribeToChats(userId: string, callback: (chats: ChatRoom[]) => void): () => void {
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatRoom));
      callback(chats);
    });
  }

  // Mark message as read
  static async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const messageRef = doc(db, 'messages', messageId);
    await updateDoc(messageRef, {
      readBy: arrayUnion(userId)
    });
  }

  // Create event chat
  static async createEventChat(eventId: string): Promise<void> {
    const chatRef = doc(db, 'chats', eventId);
    await setDoc(chatRef, {
      type: 'event',
      eventId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}
