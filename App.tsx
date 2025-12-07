
import React, { useState, useEffect } from 'react';
import { Page, RoomMatch, User, JoinRequest, RequestStatus, RoomOwner, Notification, BasicUserInfo } from './types';
import Header from './components/Header';
import RoomList from './components/RoomList';
import CreateRoomForm from './components/CreateRoomForm';
import RoomDetails from './components/RoomDetails';
import UserProfile from './components/UserProfile';
import AuthPage from './components/AuthPage';
import VoiceChat from './components/VoiceChat';
import { MOCK_USERS } from './constants';
import { auth, db } from './firebase';
// FIX: Use v8 compat imports to resolve module export errors.
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';


const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [rooms, setRooms] = useState<RoomMatch[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<RoomMatch | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // FIX: Use `auth.onAuthStateChanged` from the v8 SDK.
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
            const userDocRef = db.collection("users").doc(firebaseUser.uid);
            const userDoc = await userDocRef.get();
            if (userDoc.exists) {
                setCurrentUser({ id: userDoc.id, ...userDoc.data() } as User);
            }
        } else {
            setCurrentUser(null);
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Effect for automatic background cleanup of expired rooms.
  useEffect(() => {
    if (!currentUser) return;

    const runCleanup = async () => {
        const now = new Date();
        const fifteenMinutesAgo = firebase.firestore.Timestamp.fromDate(new Date(now.getTime() - 15 * 60 * 1000));

        try {
            const expiredRoomsQuery = db.collection("rooms").where("createdAt", "<", fifteenMinutesAgo);
            const snapshot = await expiredRoomsQuery.get();

            if (snapshot.empty) {
                return; // Nothing to clean up.
            }

            const batch = db.batch();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`[SquadMatch] Automatically deleted ${snapshot.size} expired room(s).`);
        } catch (err: any) {
            // This is a background task. We log the error but don't show it to the user,
            // as it could be a transient issue or related to index creation.
            console.error("Error during automatic room cleanup:", err);
        }
    };

    // Run cleanup immediately on login, then set an interval to run every minute.
    runCleanup();
    const cleanupInterval = setInterval(runCleanup, 60 * 1000); // 1 minute

    return () => {
      clearInterval(cleanupInterval);
    };
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setRooms([]);
      setNotifications([]);
      return;
    }

    setError(null);
    
    // Query for rooms created in the last 15 minutes to display in the UI.
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const roomsQuery = db.collection("rooms")
        .where("createdAt", ">=", firebase.firestore.Timestamp.fromDate(fifteenMinutesAgo))
        .orderBy("createdAt", "desc");

    const roomsUnsubscribe = roomsQuery.onSnapshot((snapshot) => {
        const validRooms = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                startTime: (data.startTime as firebase.firestore.Timestamp).toDate(),
                createdAt: (data.createdAt as firebase.firestore.Timestamp).toDate(),
            } as unknown as RoomMatch;
        });
        setRooms(validRooms);
    }, (err: any) => {
        console.error("Firestore (rooms) error:", err);
        let message = "Could not load rooms. This is likely a permissions issue. Please check your Firestore security rules.";
        if (err.code === 'failed-precondition') {
             message = "Could not load rooms. This query requires a custom index. Please check the developer console (F12) for a link to create the necessary Firestore index.";
        }
        setError(message);
    });

    const notificationsQuery = db.collection("notifications").where("userId", "==", currentUser.id);
    const notificationsUnsubscribe = notificationsQuery.onSnapshot((snapshot) => {
        const fetchedNotifications = snapshot.docs.map(doc => {
             const data = doc.data();
             return {
                id: doc.id,
                ...data,
                createdAt: (data.createdAt as firebase.firestore.Timestamp).toDate(),
             // FIX: Cast to unknown first to satisfy TypeScript's type overlap requirement.
             } as unknown as Notification
        });

        // This sort is buggy and will fail if .toDate() is not called correctly above.
        fetchedNotifications.sort((a, b) => (b.createdAt as any).getTime() - (a.createdAt as any).getTime());
        setNotifications(fetchedNotifications);
    }, (err: any) => {
        console.error("Firestore (notifications) error:", err);
        const notificationError = "Could not load notifications. This is likely a permissions issue. Please check your Firestore security rules.";
        
        if (!error) {
            setError(notificationError);
        }
    });

    return () => {
        roomsUnsubscribe();
        notificationsUnsubscribe();
    };
  }, [currentUser]);

  useEffect(() => {
    if (selectedRoom) {
        const updatedRoom = rooms.find(r => r.id === selectedRoom.id);
        setSelectedRoom(updatedRoom || null);
    }
  }, [rooms, selectedRoom]);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    if (page !== Page.ROOM_DETAILS && page !== Page.VOICE_CHAT) {
        setSelectedRoom(null);
    }
    setSelectedProfile(null);
  };

  const viewRoomDetails = (room: RoomMatch) => {
    setSelectedRoom(room);
    setCurrentPage(Page.ROOM_DETAILS);
  };

  const joinVoiceChat = (room: RoomMatch) => {
    setSelectedRoom(room);
    setCurrentPage(Page.VOICE_CHAT);
  };
  
  const viewProfile = async (user: User | RoomOwner | BasicUserInfo) => {
    const userDoc = await db.collection("users").doc(user.id).get();
    if (userDoc.exists) {
        setSelectedProfile({ id: userDoc.id, ...userDoc.data()} as User);
        setCurrentPage(Page.PROFILE);
    } else {
        console.error(`Could not find full profile for user ID: ${user.id}`);
    }
  };

  const handleLogout = async () => {
    // FIX: Use `auth.signOut` from the v8 SDK.
    await auth.signOut();
    setCurrentUser(null);
    setCurrentPage(Page.HOME);
  };
  
  const handleCreateRoom = async (newRoomData: Omit<RoomMatch, 'id' | 'owner' | 'acceptedPlayers' | 'createdAt'>) => {
    if (!currentUser) return;
    
    const owner: RoomOwner = {
      id: currentUser.id,
      name: currentUser.name,
      avatarUrl: currentUser.avatarUrl,
      isVerified: currentUser.isVerified,
    };

    // FIX: Removed incorrect type annotation. The `newRoom` object contains Firestore Timestamps, not Dates.
    const newRoom = {
      ...newRoomData,
      owner: owner,
      acceptedPlayers: [],
      createdAt: firebase.firestore.Timestamp.now(),
      // FIX: The `startTime` is now a Date object due to type changes, so the cast is no longer needed.
      startTime: firebase.firestore.Timestamp.fromDate(newRoomData.startTime),
    };
    
    await db.collection('rooms').add(newRoom);
    navigateTo(Page.HOME);
  };
  
  const handleSendRequest = async (roomId: string, ownerId: string) => {
    if (!currentUser) return;

    setError(null);
    try {
      const userRequesting: BasicUserInfo = {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        inGameId: currentUser.inGameId,
        reputation: currentUser.reputation,
        isVerified: currentUser.isVerified,
      };

      await db.collection("joinRequests").add({
        roomId: roomId,
        user: userRequesting,
        status: RequestStatus.PENDING,
        createdAt: firebase.firestore.Timestamp.now(),
        roomOwnerId: ownerId,
      });
    } catch (err: any) {
      console.error("Failed to send join request:", err);
      let message = "Could not send join request. Please try again.";
      if (err.code === 'failed-precondition') {
        message = "Could not send request. This may be due to missing database configuration (indexes). Please check the developer console for a link to create them.";
      } else if (err.code === 'permission-denied') {
        message = "Permission Denied. Your account is not allowed to send join requests.";
      }
      setError(message);
    }
  };

  const handleUpdateRequest = async (roomId: string, requestId: string, status: RequestStatus) => {
    const roomRef = db.collection("rooms").doc(roomId);
    const requestRef = db.collection("joinRequests").doc(requestId);

    try {
        await db.runTransaction(async (transaction) => {
            const requestDoc = await transaction.get(requestRef);
            const roomDoc = await transaction.get(roomRef);

            if (!requestDoc.exists) throw "Request does not exist!";
            if (!roomDoc.exists) throw "Room does not exist!";

            const requestToUpdate = requestDoc.data() as JoinRequest;
            const room = roomDoc.data() as RoomMatch;
            
            if (requestToUpdate.status !== RequestStatus.PENDING) {
                console.log("Request already handled.");
                return;
            }

            transaction.update(requestRef, { status });

            let notificationMessage = '';
            
            if (status === RequestStatus.ACCEPTED) {
                if (room.acceptedPlayers.length + 1 >= room.maxPlayers) {
                    throw "This room is already full.";
                }
                if (!room.acceptedPlayers.some(p => p.id === requestToUpdate.user.id)) {
                    transaction.update(roomRef, {
                        acceptedPlayers: firebase.firestore.FieldValue.arrayUnion(requestToUpdate.user)
                    });
                    notificationMessage = `Your request to join "${room.gameName}" was accepted.`;
                }
            } else if (status === RequestStatus.REJECTED) {
                 notificationMessage = `Your request to join "${room.gameName}" was rejected.`;
            }
            
            if (notificationMessage) {
                const newNotificationRef = db.collection("notifications").doc();
                transaction.set(newNotificationRef, {
                    userId: requestToUpdate.user.id,
                    message: notificationMessage,
                    roomId: roomId,
                    isRead: false,
                    createdAt: firebase.firestore.Timestamp.now(),
                });
            }
        });
    } catch (e: any) {
        console.error("Update request transaction failed: ", e);
        let message = "Failed to update join request. Please try again.";
        if (e?.code === 'permission-denied') {
            message = "Update request transaction failed: Missing or insufficient permissions. This may be caused by Firestore security rules that prevent modifying requests or creating notifications for other users.";
        } else if (typeof e === 'string') {
            message = e;
        }
        setError(message);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!currentUser || !selectedRoom || currentUser.id !== selectedRoom.owner.id) {
        setError("You are not authorized to delete this room.");
        return;
    }

    setError(null);
    try {
        await db.collection("rooms").doc(roomId).delete();
        navigateTo(Page.HOME);
    } catch (err: any) {
        console.error("Failed to delete room:", err);
        let message = "Could not delete room. Please try again.";
        if (err.code === 'permission-denied') {
            message = "Permission Denied. You are not allowed to delete this room.";
        }
        setError(message);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    const room = rooms.find(r => r.id === notification.roomId);
    if (room) {
        viewRoomDetails(room);
    }
    if (!notification.isRead) {
       await db.collection("notifications").doc(notification.id).update({ isRead: true });
    }
  };

  const handleMarkAllNotificationsAsRead = () => {
    notifications.forEach(async n => {
      if (!n.isRead) {
        await db.collection("notifications").doc(n.id).update({ isRead: true });
      }
    });
  };
  
  const renderPage = () => {
    if (!currentUser) return null;

    switch (currentPage) {
      case Page.HOME:
        return <RoomList rooms={rooms} onSelectRoom={viewRoomDetails} />;
      case Page.CREATE_ROOM:
        return <CreateRoomForm currentUser={currentUser} onRoomCreated={handleCreateRoom} />;
      case Page.ROOM_DETAILS:
        return selectedRoom ? <RoomDetails room={selectedRoom} currentUser={currentUser} viewProfile={viewProfile} onSendRequest={handleSendRequest} onUpdateRequest={handleUpdateRequest} onDeleteRoom={handleDeleteRoom} onJoinVoiceChat={joinVoiceChat} /> : <RoomList rooms={rooms} onSelectRoom={viewRoomDetails} />;
      case Page.PROFILE:
        return selectedProfile ? <UserProfile user={selectedProfile} /> : <UserProfile user={currentUser} />;
      case Page.VOICE_CHAT:
        return selectedRoom ? <VoiceChat room={selectedRoom} currentUser={currentUser} onLeave={() => viewRoomDetails(selectedRoom)} /> : <RoomList rooms={rooms} onSelectRoom={viewRoomDetails} />;
      default:
        return <RoomList rooms={rooms} onSelectRoom={viewRoomDetails} />;
    }
  };
  
  if (isLoading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-dark-1">
            <p className="text-xl text-light-1">Loading SquadMatch...</p>
        </div>
    )
  }

  if (!currentUser) {
    return <AuthPage onAuthSuccess={(user) => {
      setCurrentUser(user);
      navigateTo(Page.HOME);
    }} />;
  }
  
  return (
    <div className="min-h-screen bg-dark-1 font-sans">
      <Header 
        user={currentUser} 
        onNavigate={navigateTo} 
        onLogout={handleLogout}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onMarkAllAsRead={handleMarkAllNotificationsAsRead}
      />
      <main className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
