const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export const generateAIOnboarding = async (payload: any) => {
  const response = await fetch(`${BASE_URL}/api/generate-pathway`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Backend failed to generate pathway");
  return response.json();
};