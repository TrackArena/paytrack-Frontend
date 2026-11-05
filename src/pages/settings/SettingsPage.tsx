import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const { workspace } = useWorkspace();

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your profile and workspace preferences</p>
      </div>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">First name</label>
              <Input defaultValue={user?.firstName} readOnly className="bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Last name</label>
              <Input defaultValue={user?.lastName} readOnly className="bg-muted/30" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input defaultValue={user?.email} readOnly className="bg-muted/30" />
          </div>
          <Button variant="outline" size="sm" disabled>Edit profile</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Workspace</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Business name</label>
            <Input defaultValue={workspace?.name} readOnly className="bg-muted/30" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Workspace ID</label>
            <Input defaultValue={workspace?.id} readOnly className="bg-muted/30 font-mono text-xs" />
          </div>
          <Button variant="outline" size="sm" disabled>Edit workspace</Button>
        </CardContent>
      </Card>

      <Card className="border-amber-200">
        <CardHeader>
          <CardTitle>Stellar network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-medium">Currently on Testnet</p>
              <p className="text-xs mt-0.5">
                PayTrack is configured for Stellar Testnet. All transactions use test USDC.
                Mainnet support is available via the <code className="bg-amber-100 px-1 rounded">STELLAR_NETWORK</code> environment variable.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
