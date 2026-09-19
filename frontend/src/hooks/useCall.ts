import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useAuth } from "../context/AuthContext";

type IncomingCall = {
  from: string;
  fromName?: string;
  fromAvatar?: string | null;
  chatId?: string;
  callType: "audio" | "video";
  offer?: RTCSessionDescriptionInit;
};

type CallState = {
  active: boolean;
  withUserId: string | null;
  withName: string;
  chatId?: string;
  muted: boolean;
  cameraOff: boolean;
};

const iceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export function useCall(socket: Socket | null) {
  const { user } = useAuth();
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [call, setCall] = useState<CallState>({
    active: false,
    withUserId: null,
    withName: "",
    muted: false,
    cameraOff: false,
  });

  const cleanup = useCallback(() => {
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setIncoming(null);
    setCall({
      active: false,
      withUserId: null,
      withName: "",
      muted: false,
      cameraOff: false,
    });
  }, []);

  const ensurePeer = useCallback(
    (targetId: string) => {
      if (pcRef.current) return pcRef.current;

      const pc = new RTCPeerConnection({ iceServers });
      pcRef.current = pc;

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("call:ice-candidate", {
            to: targetId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0] || new MediaStream([event.track]);
        remoteStreamRef.current = stream;
        setRemoteStream(stream);
      };

      return pc;
    },
    [socket]
  );

  const getMedia = useCallback(async (video = true) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: video ? { facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const startCall = useCallback(
    async (target: { id: string; name: string; chatId?: string }) => {
      if (!socket || !user) return;
      const stream = await getMedia(true);
      const pc = ensurePeer(target.id);
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call:initiate", {
        to: target.id,
        chatId: target.chatId,
        callType: "video",
        offer,
      });

      setCall({
        active: true,
        withUserId: target.id,
        withName: target.name,
        chatId: target.chatId,
        muted: false,
        cameraOff: false,
      });
    },
    [socket, user, getMedia, ensurePeer]
  );

  const acceptCall = useCallback(async () => {
    if (!socket || !incoming) return;
    const stream = await getMedia(incoming.callType !== "audio");
    const pc = ensurePeer(incoming.from);
    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    if (incoming.offer) {
      await pc.setRemoteDescription(incoming.offer);
    }

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("call:accept", {
      to: incoming.from,
      chatId: incoming.chatId,
      answer,
    });

    setCall({
      active: true,
      withUserId: incoming.from,
      withName: incoming.fromName || "Caller",
      chatId: incoming.chatId,
      muted: false,
      cameraOff: false,
    });
    setIncoming(null);
  }, [socket, incoming, getMedia, ensurePeer]);

  const rejectCall = useCallback(() => {
    if (!socket || !incoming) return;
    socket.emit("call:reject", {
      to: incoming.from,
      chatId: incoming.chatId,
    });
    setIncoming(null);
  }, [socket, incoming]);

  const endCall = useCallback(() => {
    if (socket && call.withUserId) {
      socket.emit("call:end", {
        to: call.withUserId,
        chatId: call.chatId,
      });
    }
    cleanup();
  }, [socket, call.withUserId, call.chatId, cleanup]);

  const toggleMute = useCallback(() => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCall((prev) => ({ ...prev, muted: !track.enabled }));
  }, []);

  const toggleCamera = useCallback(() => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCall((prev) => ({ ...prev, cameraOff: !track.enabled }));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onIncoming = (payload: IncomingCall) => {
      setIncoming(payload);
    };

    const onAccepted = async (payload: {
      from: string;
      answer?: RTCSessionDescriptionInit;
    }) => {
      if (payload.answer && pcRef.current) {
        await pcRef.current.setRemoteDescription(payload.answer);
      }
    };

    const onRejected = () => cleanup();
    const onEnded = () => cleanup();

    const onIce = async (payload: {
      from: string;
      candidate?: RTCIceCandidateInit;
    }) => {
      if (payload.candidate && pcRef.current) {
        try {
          await pcRef.current.addIceCandidate(payload.candidate);
        } catch {
          /* ignore late candidates */
        }
      }
    };

    const onOffer = async (payload: {
      from: string;
      offer?: RTCSessionDescriptionInit;
    }) => {
      if (payload.offer && pcRef.current) {
        await pcRef.current.setRemoteDescription(payload.offer);
      }
    };

    const onAnswer = async (payload: {
      from: string;
      answer?: RTCSessionDescriptionInit;
    }) => {
      if (payload.answer && pcRef.current) {
        await pcRef.current.setRemoteDescription(payload.answer);
      }
    };

    const onUnavailable = () => cleanup();

    socket.on("call:incoming", onIncoming);
    socket.on("call:accepted", onAccepted);
    socket.on("call:rejected", onRejected);
    socket.on("call:ended", onEnded);
    socket.on("call:ice-candidate", onIce);
    socket.on("call:offer", onOffer);
    socket.on("call:answer", onAnswer);
    socket.on("call:unavailable", onUnavailable);

    return () => {
      socket.off("call:incoming", onIncoming);
      socket.off("call:accepted", onAccepted);
      socket.off("call:rejected", onRejected);
      socket.off("call:ended", onEnded);
      socket.off("call:ice-candidate", onIce);
      socket.off("call:offer", onOffer);
      socket.off("call:answer", onAnswer);
      socket.off("call:unavailable", onUnavailable);
    };
  }, [socket, cleanup]);

  return {
    call,
    incoming,
    localStream,
    remoteStream,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
