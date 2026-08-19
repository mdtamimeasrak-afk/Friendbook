import { useCallback, useEffect, useState } from "react";

import { friendService, type FriendStatus } from "@/services/friendService";

/**
 * Reusable friend-status hook for any user profile.
 * Provides the current status plus every mutation the schema supports
 * (send, cancel, accept, decline, remove, block, unblock). Each action
 * refreshes the status after success so the UI always reflects the DB.
 */
export function useFriendStatus(meId: string | undefined, otherId: string | undefined) {
  const [status, setStatus] = useState<FriendStatus>("none");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!meId || !otherId || meId === otherId) {
      setStatus("none");
      setLoading(false);
      return;
    }
    setLoading(true);
    const { status: next, error: statusError } = await friendService.getStatusWith(meId, otherId);
    setStatus(next);
    setError(statusError);
    setLoading(false);
  }, [meId, otherId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const run = useCallback(
    async (action: () => Promise<{ error: string | null }>) => {
      if (!meId || !otherId || busy) {
        return;
      }
      setBusy(true);
      setError(null);
      const { error: actionError } = await action();
      setBusy(false);
      if (actionError) {
        setError(actionError);
        return;
      }
      await reload();
    },
    [meId, otherId, busy, reload]
  );

  const sendRequest = useCallback(() => run(() => friendService.sendRequest(meId!, otherId!)), [run, meId, otherId]);
  const cancelRequest = useCallback(() => run(() => friendService.cancelRequest(meId!, otherId!)), [run, meId, otherId]);
  const acceptRequest = useCallback(() => run(() => friendService.acceptRequest(meId!, otherId!)), [run, meId, otherId]);
  const declineRequest = useCallback(() => run(() => friendService.declineRequest(meId!, otherId!)), [run, meId, otherId]);
  const removeFriend = useCallback(() => run(() => friendService.removeFriend(meId!, otherId!)), [run, meId, otherId]);
  const blockUser = useCallback(() => run(() => friendService.blockUser(meId!, otherId!)), [run, meId, otherId]);
  const unblockUser = useCallback(() => run(() => friendService.unblockUser(meId!, otherId!)), [run, meId, otherId]);

  return {
    status,
    loading,
    busy,
    error,
    reload,
    sendRequest,
    cancelRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    blockUser,
    unblockUser,
  };
}