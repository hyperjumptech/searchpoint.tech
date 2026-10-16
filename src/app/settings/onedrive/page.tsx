import { getMe } from "@/actions/me";
import { getPreferences } from "@/actions/onedrive-settings";
import { OneDriveSettingsClient } from "./page.client";

export const metadata = {
  title: "OneDrive Search Settings | SearchPoint",
  description: "Manage your OneDrive search permissions and invite colleagues.",
};

export default async function OneDriveSettingsPage() {
  const [me, prefs] = await Promise.all([getMe(), getPreferences()]);

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background">
      <OneDriveSettingsClient
        email={me?.email}
        initialAutoGrantEnabled={prefs.auto_grant_enabled}
      />
    </main>
  );
}
