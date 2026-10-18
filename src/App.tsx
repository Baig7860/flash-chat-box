import { useState } from "react";
import Welcome from "./components/Welcome";
import Chat from "./components/Chat";
import { DEFAULT_ROOM, STORAGE_NICKNAME } from "./lib/api";

export default function App() {
  const [nickname, setNickname] = useState<string | null>(() =>
    localStorage.getItem(STORAGE_NICKNAME),
  );

  if (nickname) {
    return (
      <Chat
        room={DEFAULT_ROOM}
        nickname={nickname}
        onLeave={() => {
          localStorage.removeItem(STORAGE_NICKNAME);
          setNickname(null);
        }}
      />
    );
  }

  return (
    <Welcome
      onJoin={(name) => {
        localStorage.setItem(STORAGE_NICKNAME, name);
        setNickname(name);
      }}
    />
  );
}
