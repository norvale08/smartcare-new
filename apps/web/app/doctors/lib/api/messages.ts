const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchMessages(token: string, patientId?: string) {
  const url = new URL(`${API_URL}/api/messages`);
  if (patientId) {
    url.searchParams.append("patientId", patientId);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Fetch messages error:", errorData);
    throw new Error("Failed to fetch messages");
  }

  return res.json();
}

export async function sendMessage(
  token: string,
  toId: string,
  toType: "patient" | "doctor",
  message: string
) {
  const res = await fetch(`${API_URL}/api/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ toId, toType, message }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    console.error("Send message error:", errorData);
    throw new Error("Failed to send message");
  }

  return res.json();
}
