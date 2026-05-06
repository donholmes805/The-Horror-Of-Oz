"use server";

import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { auth } from "firebase-admin";
import { GameRoom, RoomPlayer, GameMode, RoomStatus } from "@/types/multiplayer";
import { cookies } from "next/headers";

// Helper to check if user is a paid member
async function checkPaidAccess(userId: string) {
  const userDoc = await adminDb.collection("users").doc(userId).get();
  const userData = userDoc.data();
  
  // Owner/Admin override
  if (userData?.role === 'owner' || userData?.role === 'admin' || userData?.isInternal) {
    return true;
  }
  
  return userData?.membershipStatus === 'paid';
}

// Helper to generate a readable invite code
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'OZ-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createPvpRoom(userId: string, username: string) {
  try {
    const hasAccess = await checkPaidAccess(userId);
    if (!hasAccess) {
      throw new Error("Paid membership required to create PvP rooms.");
    }

    const inviteCode = generateInviteCode();
    
    // Check for duplicate active code (unlikely but safe)
    const existing = await adminDb.collection("gameRooms")
      .where("inviteCode", "==", inviteCode)
      .where("status", "==", "waiting")
      .get();
      
    if (!existing.empty) {
      return createPvpRoom(userId, username); // Retry
    }

    const roomId = adminDb.collection("gameRooms").doc().id;
    const now = Timestamp.now() as any;

    const roomData: Partial<GameRoom> = {
      id: roomId,
      mode: 'pvp' as GameMode,
      status: 'waiting' as RoomStatus,
      hostUserId: userId,
      playerIds: [userId],
      maxPlayers: 2,
      minPlayers: 2,
      paidOnly: true,
      inviteCode,
      createdAt: now,
      currentRound: 1,
      turnOrder: [],
      roomState: {
        lastAction: 'room_created',
        lastActionAt: now.toMillis()
      },
      settings: {
        turnLimitSeconds: 60,
        allowSpectators: false,
        isPublic: false
      }
    };

    await adminDb.collection("gameRooms").doc(roomId).set(roomData);

    // Initial player stats
    const userDoc = await adminDb.collection("users").doc(userId).get();
    const profile = userDoc.data();
    
    const playerStats = {
      health: 15,
      maxHealth: 15,
      courage: profile?.stats?.courage || 2,
      hope: profile?.stats?.hope || 2,
      steel: profile?.stats?.steel || 2,
      memory: profile?.stats?.memory || 1
    };

    const playerData: RoomPlayer = {
      userId,
      username,
      avatar: profile?.avatar || '',
      membershipStatus: 'paid', // Verified above
      joinedAt: now,
      ready: false,
      roleInRoom: 'host',
      stats: playerStats,
      inventory: {
        hand: [],
        deck: [],
        discard: []
      },
      status: 'active'
    };

    await adminDb.collection("gameRooms").doc(roomId).collection("players").doc(userId).set(playerData);

    return { success: true, roomId, inviteCode };
  } catch (error: any) {
    console.error("Create Room Error:", error);
    return { success: false, error: error.message };
  }
}

export async function joinPvpRoom(userId: string, username: string, inviteCode: string) {
  try {
    const hasAccess = await checkPaidAccess(userId);
    if (!hasAccess) {
      throw new Error("Paid membership required to join PvP rooms.");
    }

    const roomSnap = await adminDb.collection("gameRooms")
      .where("inviteCode", "==", inviteCode.toUpperCase())
      .where("status", "==", "waiting")
      .limit(1)
      .get();

    if (roomSnap.empty) {
      throw new Error("Invalid or expired invite code.");
    }

    const roomDoc = roomSnap.docs[0];
    const roomData = roomDoc.data();
    const roomId = roomDoc.id;

    if (roomData.playerIds.includes(userId)) {
      return { success: true, roomId }; // Already in
    }

    if (roomData.playerIds.length >= roomData.maxPlayers) {
      throw new Error("Room is full.");
    }

    const now = Timestamp.now() as any;
    
    // Update room playerIds
    await roomDoc.ref.update({
      playerIds: FieldValue.arrayUnion(userId)
    });

    const userDoc = await adminDb.collection("users").doc(userId).get();
    const profile = userDoc.data();

    const playerStats = {
      health: 15,
      maxHealth: 15,
      courage: profile?.stats?.courage || 2,
      hope: profile?.stats?.hope || 2,
      steel: profile?.stats?.steel || 2,
      memory: profile?.stats?.memory || 1
    };

    const playerData: RoomPlayer = {
      userId,
      username,
      avatar: profile?.avatar || '',
      membershipStatus: 'paid',
      joinedAt: now,
      ready: false,
      roleInRoom: 'player',
      stats: playerStats,
      inventory: {
        hand: [],
        deck: [],
        discard: []
      },
      status: 'active'
    };

    await adminDb.collection("gameRooms").doc(roomId).collection("players").doc(userId).set(playerData);

    return { success: true, roomId };
  } catch (error: any) {
    console.error("Join Room Error:", error);
    return { success: false, error: error.message };
  }
}

export async function setPlayerReady(roomId: string, userId: string, ready: boolean) {
  try {
    await adminDb.collection("gameRooms").doc(roomId).collection("players").doc(userId).update({
      ready
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function startPvpMatch(roomId: string, userId: string) {
  try {
    const roomRef = adminDb.collection("gameRooms").doc(roomId);
    const roomSnap = await roomRef.get();
    const roomData = roomSnap.data();

    if (!roomData) throw new Error("Room not found.");
    if (roomData.hostUserId !== userId) throw new Error("Only the host can start the match.");
    if (roomData.playerIds.length < 2) throw new Error("Need two players to start.");

    const playersSnap = await roomRef.collection("players").get();
    const allReady = playersSnap.docs.every((d: any) => d.data().ready);
    
    // Allow owner to bypass ready check for testing if needed, but for now strict
    if (!allReady) throw new Error("All players must be ready.");

    const now = Timestamp.now() as any;
    const turnOrder = [...roomData.playerIds].sort(() => Math.random() - 0.5);

    await roomRef.update({
      status: 'active',
      startedAt: now,
      turnOrder,
      currentTurnUserId: turnOrder[0],
      currentRound: 1
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function submitPvpAction(roomId: string, userId: string, action: string, payload: any) {
  try {
    const roomRef = adminDb.collection("gameRooms").doc(roomId);
    const roomSnap = await roomRef.get();
    const roomData = roomSnap.data();

    if (!roomData || roomData.status !== 'active') throw new Error("Match not active.");
    if (roomData.currentTurnUserId !== userId) throw new Error("Not your turn.");

    const opponentId = roomData.playerIds.find((id: string) => id !== userId);
    if (!opponentId) throw new Error("Opponent not found.");

    const playerRef = roomRef.collection("players").doc(userId);
    const opponentRef = roomRef.collection("players").doc(opponentId);
    
    const playerSnap = await playerRef.get();
    const opponentSnap = await opponentRef.get();
    
    const player = playerSnap.data() as RoomPlayer;
    const opponent = opponentSnap.data() as RoomPlayer;

    let playerDamage = 0;
    let enemyDamage = 0;
    let logMessage = "";

    // Simple Combat Math
    const roll = Math.floor(Math.random() * 3); // 0-2 Risk Roll
    
    switch (action) {
      case 'strike':
        const strikeScore = player.stats.steel + roll;
        const defenseBonus = opponent.roomState?.defending ? 2 : 0;
        if (strikeScore >= (opponent.stats.steel + defenseBonus)) {
          enemyDamage = 2;
          if (strikeScore > opponent.stats.steel + defenseBonus + 2) enemyDamage = 3;
          logMessage = `${player.username} strikes for ${enemyDamage} damage!`;
        } else {
          logMessage = `${player.username}'s strike was deflected.`;
        }
        break;
      case 'defend':
        await playerRef.update({ "roomState.defending": true });
        logMessage = `${player.username} braces for impact.`;
        break;
      case 'evade':
        const evadeScore = player.stats.memory + roll;
        if (evadeScore > opponent.stats.steel) {
          logMessage = `${player.username} prepares a nimble evasion.`;
          await playerRef.update({ "roomState.evading": true });
        } else {
          logMessage = `${player.username} failed to find an opening to evade.`;
        }
        break;
    }

    // Apply Damage
    if (enemyDamage > 0) {
      const newOpponentHp = Math.max(0, opponent.stats.health - enemyDamage);
      await opponentRef.update({ "stats.health": newOpponentHp });
      
      if (newOpponentHp <= 0) {
        // MATCH OVER
        await roomRef.update({
          status: 'completed',
          endedAt: Timestamp.now() as any,
          winnerUserId: userId,
          loserUserId: opponentId
        });
        
        // Save Match Result
        await adminDb.collection("matchResults").add({
          roomId,
          mode: 'pvp',
          winnerUserId: userId,
          loserUserId: opponentId,
          resultType: 'defeated',
          createdAt: Timestamp.now() as any
        });

        // Small reward for winner (Beta)
        await adminDb.collection("users").doc(userId).update({
          yellowShards: FieldValue.increment(5)
        });

        return { success: true, matchOver: true };
      }
    }

    // Switch Turn
    const currentIndex = roomData.turnOrder.indexOf(userId);
    const nextIndex = (currentIndex + 1) % roomData.turnOrder.length;
    const nextTurnUserId = roomData.turnOrder[nextIndex];

    const updateData: any = {
      currentTurnUserId: nextTurnUserId,
      "roomState.lastAction": action,
      "roomState.lastActor": userId,
      "roomState.lastLog": logMessage
    };

    if (nextIndex === 0) {
      updateData.currentRound = FieldValue.increment(1);
    }

    await roomRef.update(updateData);
    
    // Reset temporary states for the player who just acted
    await playerRef.update({
      "roomState.defending": false,
      "roomState.evading": false
    });

    // Record Event
    await adminDb.collection("gameRoomEvents").add({
      roomId,
      type: 'action',
      actorUserId: userId,
      targetUserId: opponentId,
      message: logMessage,
      payload: { action, enemyDamage },
      createdAt: Timestamp.now()
    });

    return { success: true };
  } catch (error: any) {
    console.error("Action Error:", error);
    return { success: false, error: error.message };
  }
}

export async function leavePvpRoom(roomId: string, userId: string) {
  try {
    const roomRef = adminDb.collection("gameRooms").doc(roomId);
    const roomSnap = await roomRef.get();
    const roomData = roomSnap.data();

    if (!roomData) return { success: true };

    if (roomData.status === 'waiting') {
      if (roomData.hostUserId === userId) {
        // Cancel room if host leaves
        await roomRef.update({ status: 'canceled' });
      } else {
        // Just remove player
        await roomRef.update({
          playerIds: FieldValue.arrayRemove(userId)
        });
        await roomRef.collection("players").doc(userId).delete();
      }
    } else if (roomData.status === 'active') {
      // Surrender if in match
      return surrenderPvpMatch(roomId, userId);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function surrenderPvpMatch(roomId: string, userId: string) {
  try {
    const roomRef = adminDb.collection("gameRooms").doc(roomId);
    const roomSnap = await roomRef.get();
    const roomData = roomSnap.data();

    if (!roomData || roomData.status !== 'active') throw new Error("Match not active.");

    const opponentId = roomData.playerIds.find((id: string) => id !== userId);

    await roomRef.update({
      status: 'completed',
      endedAt: Timestamp.now(),
      winnerUserId: opponentId,
      loserUserId: userId,
      roomState: { ...roomData.roomState, surrender: true }
    });

    await adminDb.collection("matchResults").add({
      roomId,
      mode: 'pvp',
      winnerUserId: opponentId,
      loserUserId: userId,
      resultType: 'surrendered',
      createdAt: Timestamp.now()
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
