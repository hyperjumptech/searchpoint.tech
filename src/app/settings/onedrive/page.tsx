import { getMe } from "@/actions/me";
import { getPreferences, getConnections } from "@/actions/onedrive-settings";
import { OneDriveSettingsClient } from "./page.client";

export const metadata = {
  title: "OneDrive Search Settings | SearchPoint",
  description: "Manage your OneDrive search permissions and invite colleagues.",
};

export default async function OneDriveSettingsPage() {
  const [me, prefs, connections] = await Promise.all([
    getMe(),
    getPreferences(),
    getConnections(),
  ]);

  const hasActiveConnection = connections.some((c) => c.status === "active");

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      <OneDriveSettingsClient
        email={me?.email}
        initialAutoGrantEnabled={
          hasActiveConnection && prefs.auto_grant_enabled
        }
        hasActiveConnection={hasActiveConnection}
      />
    </main>
  );
}
